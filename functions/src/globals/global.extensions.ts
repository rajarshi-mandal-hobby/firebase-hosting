

declare global {
  interface Number {
    /**
     * Returns the number in Indian locale format. If isCurrency is true, returns the number as a currency.
     */
    toIndianLocale(isCurrency?: boolean): string;
  }

  interface Date {
    /**
     * Returns the year and month in the format YYYY-MM
     */
    toYearMonth(): string;
  }
}

if (!Number.prototype.toIndianLocale) {
  Number.prototype.toIndianLocale = function (isCurrency = true): string {
    const num = this.valueOf();
    const hasDecimal = num % 1 !== 0;

    const numberFormatOptions: Intl.NumberFormatOptions | undefined = isCurrency
      ? {
          style: 'currency',
          currency: 'INR',
          currencyDisplay: 'symbol',
          minimumFractionDigits: hasDecimal ? 2 : 0,
          maximumFractionDigits: hasDecimal ? 2 : 0
        }
      : undefined;

    const formatter = new Intl.NumberFormat('en-IN', numberFormatOptions);
    return formatter.format(num);
  };
}

if (!Date.prototype.toYearMonth) {
  Date.prototype.toYearMonth = function (): string {
    const yyyyMm = this.toISOString().slice(0, 7);
    return yyyyMm;
  };
}

export {};
