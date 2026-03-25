export const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};
