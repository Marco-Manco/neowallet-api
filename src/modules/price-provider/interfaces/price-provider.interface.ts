import { Decimal } from 'decimal.js';

export const I_PRICE_PROVIDER = Symbol('I_PRICE_PROVIDER');

export interface IPriceProvider {
  // Este método le dice a la fábrica si este proveedor soporta este par de monedas
  supports(fromCurrency: string, toCurrency: string): boolean;
  
  // Este método hace la llamada real a la API
  getExchangeRate(fromCurrency: string, toCurrency: string): Promise<Decimal>;
}