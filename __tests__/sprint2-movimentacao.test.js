import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import App from '../App';

const API_URL = 'https://6a2b396cb687a7d5cbc4fa03.mockapi.io/materiais';

const materialMock = {
  id: '101',
  nome: 'Compressa teste',
  quantidade: 10,
  categoria: 'Consumo',
};

function mockFetch() {
  global.fetch = jest.fn((url, options = {}) => {
    if (!options.method) {
      return Promise.resolve({
        ok: true,
        json: async () => [materialMock],
      });
    }

    if (options.method === 'PUT') {
      return Promise.resolve({
        ok: true,
        json: async () => JSON.parse(options.body),
      });
    }

    if (options.method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    }

    return Promise.resolve({
      ok: false,
      json: async () => ({}),
    });
  });
}

describe('Sprint 2 - Movimentacao de estoque', () => {
  beforeEach(() => {
    mockFetch();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('envia PUT com a quantidade atualizada ao baixar estoque', async () => {
    const { findByText, getByTestId } = render(<App />);

    await findByText('Compressa teste');

    fireEvent.changeText(getByTestId('input-retirada'), '3');
    fireEvent.press(getByTestId('btn-baixar'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/${materialMock.id}`,
        expect.objectContaining({ method: 'PUT' })
      );
    });

    const putCall = global.fetch.mock.calls.find(
      ([, options]) => options && options.method === 'PUT'
    );
    expect(JSON.parse(putCall[1].body).quantidade).toBe(7);
  });

  test('envia DELETE ao excluir material da lista', async () => {
    const { findByText, getByTestId } = render(<App />);

    await findByText('Compressa teste');

    fireEvent.press(getByTestId('btn-excluir'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/${materialMock.id}`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
