import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { validarRetirada } = require('./src/utils/validacoes');

const MOCKAPI_URL = 'https://6a2b396cb687a7d5cbc4fa03.mockapi.io/materiais';
const CATEGORIA_PADRAO = 'Consumo';
const LIMITE_BAIXO_ESTOQUE = 5;

const estoqueInicial = [
  { id: 'demo-1', nome: 'Luva de procedimento', quantidade: 120, categoria: CATEGORIA_PADRAO },
];

function normalizarQuantidade(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function ordenarMateriais(lista) {
  return [...lista].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
}

function montarUrlMaterial(id) {
  return `${MOCKAPI_URL}/${id}`;
}

function temRetiradaInformada(valor) {
  return normalizarQuantidade(valor) > 0;
}

function montarChaveProcessamento(acao, id) {
  return `${acao}-${id}`;
}

function criarMaterialCadastro(nome, quantidade) {
  return {
    nome,
    quantidade,
    categoria: CATEGORIA_PADRAO,
  };
}

function criarMaterialAtualizado(item, quantidade) {
  return {
    ...item,
    quantidade,
  };
}

function obterStatusEstoque(quantidade) {
  if (quantidade === 0) {
    return 'Zerado';
  }

  if (quantidade <= LIMITE_BAIXO_ESTOQUE) {
    return 'Baixo estoque';
  }

  return 'Disponivel';
}

function filtrarMateriaisPorBusca(materiais, busca) {
  const termo = busca.trim().toLowerCase();

  if (!termo) {
    return materiais;
  }

  return materiais.filter((material) =>
    String(material.nome || '').toLowerCase().includes(termo)
  );
}

function somarQuantidadeMateriais(materiais) {
  return materiais.reduce(
    (total, material) => total + normalizarQuantidade(material.quantidade),
    0
  );
}

function contarItensZerados(materiais) {
  return materiais.filter(
    (material) => normalizarQuantidade(material.quantidade) === 0
  ).length;
}

export default function App() {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [busca, setBusca] = useState('');
  const [materiais, setMateriais] = useState(estoqueInicial);
  const [retiradas, setRetiradas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [processandoItem, setProcessandoItem] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    carregarMateriais();
  }, []);

  async function carregarMateriais() {
    setCarregando(true);
    setMensagem('');

    try {
      const resposta = await fetch(MOCKAPI_URL);

      if (!resposta.ok) {
        throw new Error('Nao foi possivel carregar os materiais.');
      }

      const dados = await resposta.json();
      setMateriais(Array.isArray(dados) ? ordenarMateriais(dados) : []);
    } catch (error) {
      setMateriais((listaAtual) => (listaAtual.length ? listaAtual : estoqueInicial));
      setMensagem('Nao foi possivel carregar o estoque.');
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrarMaterial() {
    const nomeTratado = nome.trim();
    const quantidadeTratada = normalizarQuantidade(quantidade);

    if (!nomeTratado || !quantidadeTratada || quantidadeTratada <= 0) {
      setMensagem('Informe nome e quantidade maior que zero.');
      return;
    }

    const novoMaterial = criarMaterialCadastro(nomeTratado, quantidadeTratada);

    setSalvando(true);
    setMensagem('');

    try {
      const resposta = await fetch(MOCKAPI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoMaterial),
      });

      if (!resposta.ok) {
        throw new Error('Nao foi possivel cadastrar o material.');
      }

      const materialCriado = await resposta.json();
      setMateriais((listaAtual) => [materialCriado, ...listaAtual]);
      limparFormularioCadastro();
      setMensagem('Material cadastrado com sucesso.');
    } catch (error) {
      setMensagem('Erro ao cadastrar. Verifique a MockAPI.');
    } finally {
      setSalvando(false);
    }
  }

  function atualizarQuantidade(valor) {
    setQuantidade(valor.replace(/\D/g, ''));
  }

  function limparFormularioCadastro() {
    setNome('');
    setQuantidade('');
  }

  function atualizarRetirada(id, valor) {
    setRetiradas((valoresAtuais) => ({
      ...valoresAtuais,
      [id]: valor.replace(/\D/g, ''),
    }));
  }

  function limparRetirada(id) {
    setRetiradas((valoresAtuais) => ({
      ...valoresAtuais,
      [id]: '',
    }));
  }

  function removerRetirada(id) {
    setRetiradas((valoresAtuais) => {
      const novosValores = { ...valoresAtuais };
      delete novosValores[id];
      return novosValores;
    });
  }

  function atualizarMaterialLocal(materialAtualizado) {
    setMateriais((listaAtual) =>
      listaAtual.map((material) =>
        material.id === materialAtualizado.id ? materialAtualizado : material
      )
    );
  }

  function removerMaterialLocal(id) {
    setMateriais((listaAtual) =>
      listaAtual.filter((material) => material.id !== id)
    );
  }

  async function baixarMaterial(item) {
    const estoqueAtual = normalizarQuantidade(item.quantidade);
    const quantidadeRetirada = normalizarQuantidade(retiradas[item.id]);

    if (!validarRetirada(estoqueAtual, quantidadeRetirada)) {
      setMensagem('Retirada invalida. Use uma quantidade entre 1 e o saldo em estoque.');
      return;
    }

    const materialAtualizado = criarMaterialAtualizado(
      item,
      estoqueAtual - quantidadeRetirada
    );

    setProcessandoItem(montarChaveProcessamento('baixar', item.id));
    setMensagem('');

    try {
      const resposta = await fetch(montarUrlMaterial(item.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialAtualizado),
      });

      if (!resposta.ok) {
        throw new Error('Nao foi possivel baixar o estoque.');
      }

      const materialSalvo = await resposta.json();
      atualizarMaterialLocal({ ...materialAtualizado, ...materialSalvo });
      limparRetirada(item.id);
      setMensagem('Baixa registrada com sucesso.');
    } catch (error) {
      setMensagem('Erro ao baixar estoque. Verifique a MockAPI.');
    } finally {
      setProcessandoItem('');
    }
  }

  async function excluirMaterial(item) {
    setProcessandoItem(montarChaveProcessamento('excluir', item.id));
    setMensagem('');

    try {
      const resposta = await fetch(montarUrlMaterial(item.id), {
        method: 'DELETE',
      });

      if (!resposta.ok) {
        throw new Error('Nao foi possivel excluir o material.');
      }

      removerMaterialLocal(item.id);
      removerRetirada(item.id);
      setMensagem('Material excluido com sucesso.');
    } catch (error) {
      setMensagem('Erro ao excluir. Verifique a MockAPI.');
    } finally {
      setProcessandoItem('');
    }
  }

  const materiaisFiltrados = useMemo(() => {
    return filtrarMateriaisPorBusca(materiais, busca);
  }, [busca, materiais]);

  const totalQuantidade = somarQuantidadeMateriais(materiais);

  const itensZerados = contarItensZerados(materiais);

  function renderMaterial({ item }) {
    const quantidadeAtual = normalizarQuantidade(item.quantidade);
    const zerado = quantidadeAtual === 0;
    const statusEstoque = obterStatusEstoque(quantidadeAtual);
    const retiradaInformada = temRetiradaInformada(retiradas[item.id]);
    const baixando = processandoItem === montarChaveProcessamento('baixar', item.id);
    const excluindo = processandoItem === montarChaveProcessamento('excluir', item.id);

    return (
      <View style={styles.item}>
        <View style={styles.itemTopo}>
          <View style={styles.itemTextos}>
            <Text style={styles.itemNome}>{item.nome}</Text>
            <Text style={styles.itemDetalhe}>
              {item.categoria || 'Sem categoria'} - {statusEstoque}
            </Text>
          </View>
          <View style={[styles.quantidadeBadge, zerado && styles.quantidadeZerada]}>
            <Text style={[styles.quantidadeTexto, zerado && styles.quantidadeTextoZerada]}>
              {quantidadeAtual}
            </Text>
          </View>
        </View>

        <View style={styles.retiradaLinha}>
          <TextInput
            testID="input-retirada"
            accessibilityLabel={`Quantidade retirada de ${item.nome}`}
            style={styles.inputRetirada}
            placeholder="Qtd. retirada"
            placeholderTextColor="#7a8491"
            value={retiradas[item.id] || ''}
            onChangeText={(valor) => atualizarRetirada(item.id, valor)}
            keyboardType="numeric"
            returnKeyType="done"
          />

          <TouchableOpacity
            testID="btn-baixar"
            accessibilityLabel={`Baixar ${item.nome}`}
            style={[
              styles.botaoBaixar,
              (baixando || zerado || !retiradaInformada) && styles.botaoDesativado,
            ]}
            onPress={() => baixarMaterial(item)}
            disabled={baixando || excluindo || zerado || !retiradaInformada}
            activeOpacity={0.82}
          >
            <Text style={styles.botaoAcaoTexto}>{baixando ? '...' : 'Baixar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-excluir"
            accessibilityLabel={`Excluir ${item.nome}`}
            style={[styles.botaoExcluir, excluindo && styles.botaoDesativado]}
            onPress={() => excluirMaterial(item)}
            disabled={baixando || excluindo}
            activeOpacity={0.82}
          >
            <Text style={styles.botaoAcaoTexto}>{excluindo ? '...' : 'Excluir'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Almoxarifado</Text>
          <Text style={styles.subtitle}>Enfermagem</Text>
        </View>

        <View style={styles.resumo}>
          <View style={styles.resumoBloco}>
            <Text style={styles.resumoLabel}>Itens</Text>
            <Text testID="total-itens" style={styles.resumoValor}>
              {materiais.length}
            </Text>
          </View>
          <View style={styles.resumoBloco}>
            <Text style={styles.resumoLabel}>Unidades</Text>
            <Text style={styles.resumoValor}>{totalQuantidade}</Text>
          </View>
          <View style={styles.resumoBloco}>
            <Text style={styles.resumoLabel}>Zerados</Text>
            <Text style={[styles.resumoValor, styles.resumoAlerta]}>{itensZerados}</Text>
          </View>
        </View>

        <View style={styles.formulario}>
          <TextInput
            testID="input-nome"
            style={styles.input}
            placeholder="Nome do material"
            placeholderTextColor="#7a8491"
            value={nome}
            onChangeText={setNome}
          />

          <TextInput
            testID="input-quantidade"
            style={styles.input}
            placeholder="Quantidade"
            placeholderTextColor="#7a8491"
            value={quantidade}
            onChangeText={atualizarQuantidade}
            keyboardType="numeric"
            returnKeyType="done"
          />

          <TouchableOpacity
            testID="btn-cadastrar"
            accessibilityLabel="Cadastrar material"
            style={[styles.botao, salvando && styles.botaoDesativado]}
            onPress={cadastrarMaterial}
            disabled={salvando}
            activeOpacity={0.82}
          >
            <Text style={styles.botaoTexto}>{salvando ? 'Cadastrando...' : 'Cadastrar'}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          testID="input-busca"
          style={styles.inputBusca}
          placeholder="Buscar material"
          placeholderTextColor="#7a8491"
          value={busca}
          onChangeText={setBusca}
        />

        <Text style={styles.resultadoBusca}>
          Mostrando {materiaisFiltrados.length} de {materiais.length} material(is).
        </Text>

        {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}

        {itensZerados > 0 ? (
          <Text style={styles.alertaEstoque}>
            {itensZerados} item(ns) precisam de reposicao.
          </Text>
        ) : null}

        {carregando ? (
          <View style={styles.loadingLinha}>
            <ActivityIndicator color="#0f766e" />
            <Text style={styles.loadingTexto}>Carregando estoque...</Text>
          </View>
        ) : null}

        <View testID="lista-materials" style={styles.listaCompatibilidade}>
          <FlatList
            testID="lista-materiais"
            data={materiaisFiltrados}
            keyExtractor={(item, index) => String(item.id || index)}
            renderItem={renderMaterial}
            contentContainerStyle={styles.listaConteudo}
            refreshControl={
              <RefreshControl
                refreshing={carregando}
                onRefresh={carregarMateriais}
                colors={['#0f766e']}
                tintColor="#0f766e"
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.listaVazia}>Nenhum material encontrado.</Text>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef4f3',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#102a43',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#486581',
    fontSize: 16,
    marginTop: 2,
  },
  resumo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  resumoBloco: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d9e2ec',
  },
  resumoLabel: {
    color: '#627d98',
    fontSize: 13,
    fontWeight: '600',
  },
  resumoValor: {
    color: '#102a43',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  resumoAlerta: {
    color: '#be123c',
  },
  formulario: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    marginBottom: 12,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#bcccdc',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#102a43',
    backgroundColor: '#f8fafc',
    marginBottom: 10,
    fontSize: 15,
  },
  botao: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoDesativado: {
    opacity: 0.65,
  },
  botaoTexto: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  inputBusca: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#bcccdc',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#102a43',
    backgroundColor: '#ffffff',
    marginBottom: 8,
    fontSize: 15,
  },
  resultadoBusca: {
    color: '#627d98',
    fontSize: 13,
    marginBottom: 8,
  },
  mensagem: {
    color: '#334e68',
    fontSize: 13,
    marginBottom: 8,
  },
  alertaEstoque: {
    color: '#9f1239',
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingLinha: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingTexto: {
    color: '#486581',
  },
  listaCompatibilidade: {
    flex: 1,
  },
  listaConteudo: {
    paddingBottom: 22,
  },
  item: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    marginBottom: 10,
  },
  itemTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTextos: {
    flex: 1,
    paddingRight: 12,
  },
  itemNome: {
    color: '#102a43',
    fontSize: 16,
    fontWeight: '800',
  },
  itemDetalhe: {
    color: '#627d98',
    fontSize: 13,
    marginTop: 4,
  },
  quantidadeBadge: {
    minWidth: 54,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  quantidadeZerada: {
    backgroundColor: '#ffe4e6',
  },
  quantidadeTexto: {
    color: '#0f766e',
    fontWeight: '800',
    fontSize: 16,
  },
  quantidadeTextoZerada: {
    color: '#be123c',
  },
  retiradaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  inputRetirada: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#bcccdc',
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#102a43',
    backgroundColor: '#f8fafc',
    fontSize: 14,
  },
  botaoBaixar: {
    minHeight: 42,
    minWidth: 74,
    borderRadius: 8,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  botaoExcluir: {
    minHeight: 42,
    minWidth: 74,
    borderRadius: 8,
    backgroundColor: '#be123c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  botaoAcaoTexto: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  listaVazia: {
    color: '#627d98',
    textAlign: 'center',
    marginTop: 28,
  },
});
