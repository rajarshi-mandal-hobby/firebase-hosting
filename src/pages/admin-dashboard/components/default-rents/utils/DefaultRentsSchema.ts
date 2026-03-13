import { pipe, check, forward, object, partialCheck, string, toLowerCase } from 'valibot';
import { IntegerSchema, FourDigitSchema, ThreeToFourDigitSchema } from '../../../../../data/types/valibotShemas';

const UpiVpaSchema = pipe(
    string('Must be a string'),
    toLowerCase(),
    check((s) => {
        if (!s) return true;
        return /^[a-z0-9_-]{3,20}@[a-z0-9]{3,10}$/.test(s);
    }, 'Must be UPI VPA format (e.g. name@bank)')
);

export const DefaultRentsSchema = pipe(
    object({
        secondBed: FourDigitSchema,
        secondRoom: IntegerSchema,
        secondSpecial: FourDigitSchema,
        thirdBed: FourDigitSchema,
        thirdRoom: IntegerSchema,
        securityDeposit: FourDigitSchema,
        wifiMonthlyCharge: ThreeToFourDigitSchema,
        upiVpa: UpiVpaSchema
    }),
    forward(
        partialCheck(
            [['secondBed'], ['secondRoom']],
            (input) => input.secondRoom >= input.secondBed * 2,
            'Must be at least double the Bed rent.'
        ),
        ['secondRoom']
    ),
    forward(
        partialCheck(
            [['secondBed'], ['secondSpecial']],
            (input) => input.secondSpecial >= input.secondBed + 100,
            'Must be ₹100 greater than Bed rent.'
        ),
        ['secondSpecial']
    ),
    forward(
        partialCheck(
            [['thirdBed'], ['thirdRoom']],
            (input) => input.thirdRoom >= input.thirdBed * 2,
            'Must be at least double the Bed rent.'
        ),
        ['thirdRoom']
    )
);
