declare global {
   interface Number {
      /**
       * Returns the number in Indian locale format. If isCurrency is true, returns the number as a currency.
       */
      toIndianLocale(isCurrency?: boolean): string;
      /**
       * Returns the number as a currency
       */
      toNumber(): number ;
   }

   interface Date {
      /**
       * Returns the year and month in the format YYYY-MM
       */
      toYearMonth(): string;
   }

   interface String {
      /**
       * Returns the string as a number
       */
      toNumber(): number;
   }
}

if (!Number.prototype.toIndianLocale) {
   Object.defineProperty(Number.prototype, "toIndianLocale", {
      value: function (isCurrency = true): string {
         const num = this.valueOf();
         const hasDecimal = num % 1 !== 0;

         const numberFormatOptions: Intl.NumberFormatOptions | undefined = isCurrency
            ? {
                 style: "currency",
                 currency: "INR",
                 currencyDisplay: "symbol",
                 minimumFractionDigits: hasDecimal ? 2 : 0,
                 maximumFractionDigits: hasDecimal ? 2 : 0
              }
            : undefined;

         const formatter = new Intl.NumberFormat("en-IN", numberFormatOptions);
         return formatter.format(num);
      },
      enumerable: false, // Prevents listing in for...in loops
      configurable: true,
      writable: true
   });
}

export {};
