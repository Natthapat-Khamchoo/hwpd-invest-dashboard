export const UNIT_COMMANDERS = {
    // 0: Main HQ (Defaults)
    '0': {
        commander: 'พล.ต.ต.พรศักดิ์ เลารุจิราลัย ผบก.ทล.',
        unitName: 'บก.ทล.'
    },
    // Sub-units
    '1': {
        commander: 'พ.ต.อ.ธัช โพธิ์สุวรรณ ผกก.1 บก.ทล.',
        unitName: 'กก.1 บก.ทล.'
    },
    '2': {
        commander: 'พ.ต.อ.ภคพล สุชล ผกก.2 บก.ทล.',
        unitName: 'กก.2 บก.ทล.'
    },
    '3': {
        commander: 'พ.ต.อ.นโรตม์ ยุวบูรณ์ ผกก.3 บก.ทล.',
        unitName: 'กก.3 บก.ทล.'
    },
    '4': {
        commander: 'พ.ต.อ.วันชนะ ทิพย์อาสน์ ผกก.4 บก.ทล.',
        unitName: 'กก.4 บก.ทล.'
    },
    '5': {
        commander: 'พ.ต.อ.สาธิต สมานภาพ ผกก.5 บก.ทล.',
        unitName: 'กก.5 บก.ทล.'
    },
    '6': {
        commander: 'พ.ต.อ.วิษณุ คำโนนม่วง ผกก.6 บก.ทล.',
        unitName: 'กก.6 บก.ทล.'
    },
    '7': {
        commander: 'พ.ต.อ.อินทรัตน์ ปัญญา ผกก.7 บก.ทล.',
        unitName: 'กก.7 บก.ทล.'
    },
    '8': {
        commander: 'พ.ต.อ.กึกก้อง ดิศวัฒน์ ผกก.8 บก.ทล.',
        unitName: 'กก.8 บก.ทล.'
    }
};

export const getMainCommander = (unitId) => {
    if (!unitId || !UNIT_COMMANDERS[unitId]) return UNIT_COMMANDERS['0'];
    return UNIT_COMMANDERS[unitId];
};
