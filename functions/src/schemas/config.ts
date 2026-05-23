import * as v from 'valibot';
import { IntegerSchema, FourDigitSchema, ThreeToFourDigitSchema } from './index.js';

const BedScheme = v.pipe(
    IntegerSchema,
    v.minValue(1600, 'Must be at least ₹1600'),
    v.maxValue(9999, 'Must be at most ₹9999')
);

const RoomScheme = v.pipe(
    IntegerSchema,
    v.minValue(3200, 'Must be at least ₹3200'),
    v.maxValue(19998, 'Must be at most ₹19998')
);

const UpiVpaSchema = v.pipe(
    v.string('Must be a string'),
    v.toLowerCase(),
    v.check((s) => {
        if (!s) return true;
        return /^[a-z0-9_-]{3,20}@[a-z0-9]{3,10}$/.test(s);
    }, 'Must be UPI VPA format (e.g. name@bank)')
);

export const DefaultRentsSchema = v.pipe(
    v.object({
        secondBed: BedScheme,
        secondRoom: RoomScheme,
        secondSpecial: BedScheme,
        thirdBed: BedScheme,
        thirdRoom: RoomScheme,
        securityDeposit: FourDigitSchema,
        wifiMonthlyCharge: ThreeToFourDigitSchema,
        upiVpa: UpiVpaSchema
    }),
    v.forward(
        v.partialCheck(
            [['secondBed'], ['secondRoom']],
            (input) => input.secondRoom >= input.secondBed * 2,
            'Must be at least double the Bed rent.'
        ),
        ['secondRoom']
    ),
    v.forward(
        v.partialCheck(
            [['secondBed'], ['secondSpecial']],
            (input) => input.secondSpecial >= input.secondBed + 100,
            'Must be ₹100 greater than Bed rent.'
        ),
        ['secondSpecial']
    ),
    v.forward(
        v.partialCheck(
            [['thirdBed'], ['thirdRoom']],
            (input) => input.thirdRoom >= input.thirdBed * 2,
            'Must be at least double the Bed rent.'
        ),
        ['thirdRoom']
    )
);

export const parseDefaultRentsSchema = (requestData: unknown) => v.safeParse(DefaultRentsSchema, requestData);
