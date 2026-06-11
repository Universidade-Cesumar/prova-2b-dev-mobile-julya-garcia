function validarRetirada(estoqueAtual, quantidadeRetirada) {
  const estoque = Number(estoqueAtual);
  const retirada = Number(quantidadeRetirada);

  if (!Number.isFinite(estoque) || !Number.isFinite(retirada)) {
    return false;
  }

  if (retirada <= 0) {
    return false;
  }

  return retirada <= estoque;
}

module.exports = {
  validarRetirada,
};
