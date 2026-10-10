// Copy-text report (เรียน ผู้บังคับบัญชา ...): shared by the dashboard's "คัดลอกรายงาน" button and the LINE bot.
// s = counts from calculateDashboardStats; isAllUnits switches the accident section to the กก.1-7 / กก.8 split.
export const buildReportText = ({ s, commander, unitName, headerDateText, isAllUnits }) => {
    // สร้างฟังก์ชันสั้นๆ สำหรับจัดรูปแบบตัวเลข และป้องกันค่าที่ไม่ได้กำหนด
    const fmt = (num) => Number(num || 0).toLocaleString('en-US');

    const accidentReportSection = isAllUnits 
      ? `🔻4. รับแจ้งอุบัติเหตุ รวม ${fmt(s.accidentsTotal)} ครั้ง
- พื้นที่ กก.1-7: เกิดเหตุ ${fmt(s.accidents1to7Total || 0)} ครั้ง 
  (เสียชีวิต ${fmt(s.accidents1to7Death || 0)}, บาดเจ็บ ${fmt(s.accidents1to7Injured || 0)})
  มูลค่าความเสียหาย ${fmt(s.accidents1to7Damage || 0)} บาท
- พื้นที่ กก.8: เกิดเหตุ ${fmt(s.accidents8Total || 0)} ครั้ง 
  (เสียชีวิต ${fmt(s.accidents8Death || 0)}, บาดเจ็บ ${fmt(s.accidents8Injured || 0)})
  มูลค่าความเสียหาย ${fmt(s.accidents8Damage || 0)} บาท`
      : `🔻4. รับแจ้งอุบัติเหตุ รวม ${fmt(s.accidentsTotal)} ครั้ง
- เสียชีวิต ${fmt(s.accidentsDeath)} ราย
- บาดเจ็บ ${fmt(s.accidentsInjured)} ราย
- มูลค่าความเสียหาย ${fmt(s.accidentsDamage || 0)} บาท`;

    return `เรียน ผู้บังคับบัญชา

📍ภายใต้การอำนวยการของ ${commander}
ขอรายงานผลการปฏิบัติงานของ ${unitName}
🗓️ ${headerDateText.trim()}

🔻1. ผลการจับกุมคดีอาญา รวม ${fmt(s.criminalTotal)} ราย
- ความผิดซึ่งหน้า ${fmt(s.flagrantTotal)} ราย
- หมายจับ ${fmt(s.warrantTotal)} ราย
แบ่งเป็นประเภทฐานความผิด ดังนี้
- พ.ร.บ.ยาเสพติด  ${fmt(s.offenseDrugs)} ราย
- พ.ร.บ.อาวุธปืน   ${fmt(s.offenseGuns)} ราย
- พ.ร.บ.คนเข้าเมือง  ${fmt(s.offenseImmig)} ราย
- รถบรรทุกน้ำหนักเกินฯ ${fmt(s.offenseWeight)} ราย
- ขับรถขณะเมาสุรา ${fmt(s.offenseDrunk)} ราย
- อื่นๆ ${fmt(s.offenseCustoms + s.offenseDisease + s.offenseTransport + s.offenseDocs + s.offenseProperty + s.offenseSex + s.offenseLife + s.offenseCom + s.offenseOther)} ราย

🔻2. ผลการจับกุมคดีจราจร รวม ${fmt(s.trafficTotal)} ราย
- ไม่ชิดขอบทางด้านซ้าย ${fmt(s.trafficNotKeepLeft)} ราย
- ไม่ปกคลุม ${fmt(s.trafficNotCovered)} ราย
- ดัดแปลงสภาพรถ ${fmt(s.trafficModify)} ราย
- อุปกรณ์ส่วนควบไม่ครบ ${fmt(s.trafficNoPart)} ราย
- ฝ่าฝืนเครื่องหมายจราจร ${fmt(s.trafficSign)} ราย
- ฝ่าฝืนเครื่องสัญญาณไฟจราจร ${fmt(s.trafficLight)} ราย
- ขับรถเร็วเกินกำหนด ${fmt(s.trafficSpeed)} ราย
- ไม่ติดแผ่นป้ายทะเบียน ${fmt(s.trafficNoPlate)} ราย
- ขาดต่อภาษี/พ.ร.บ.ฯ ${fmt(s.trafficTax)} ราย
- อื่นๆ ${fmt(s.trafficGeneral)} ราย

🔻3. นำขบวน รวม ${fmt(s.convoyTotal)} ขบวน
- ขบวน ถปภ. ${fmt(s.convoyRoyal)} ขบวน
- ขบวนทั่วไป ${fmt(s.convoyGeneral)} ขบวน

${accidentReportSection}

🔻5. ตรวจยึดของกลาง
- ยาเสพติด (ยาบ้า ${fmt(s.seized.drugs.yaba)} เม็ด, ไอซ์ ${fmt(s.seized.drugs.ice)} กรัม)
- อาวุธปืนและเครื่องกระสุน (ปืน ${fmt(s.seized.guns.registered + s.seized.guns.unregistered)} กระบอก, กระสุน ${fmt(s.seized.guns.bullets)} นัด)
- รถยนต์ ${fmt(s.seized.vehicles.car)} คัน
- อุปกรณ์อิเล็กทรอนิกส์ ${fmt((s.seized.others.phone || 0) + (s.seized.others.electronics || 0))} รายการ (โทรศัพท์มือถือ ${fmt(s.seized.others.phone)} เครื่อง, คอมพิวเตอร์/อุปกรณ์อื่น ${fmt(s.seized.others.electronics)} เครื่อง)
- เงินสด ${fmt(s.seized.others.money)} บาท
- บัญชี ${fmt(s.seized.others.account)} บัญชี

🔻6. กิจกรรมจิตอาสา ${fmt(s.volunteerTotal)} ครั้ง
🔻7. ช่วยเหลือ/บริการประชาชน ${fmt(s.serviceTotal)} ครั้ง

จึงเรียนมาเพื่อโปรดทราบ`;
};

const OFFENSE_SHORT = [
    ['offenseDrugs', 'ยาเสพติด'], ['offenseGuns', 'ปืน'], ['offenseWeight', 'น้ำหนักเกิน'], ['offenseImmig', 'คนเข้าเมือง'],
    ['offenseDrunk', 'เมาแล้วขับ'], ['offenseCustoms', 'ศุลกากร'], ['offenseDisease', 'โรคติดต่อ'], ['offenseTransport', 'ขนส่ง'],
    ['offenseDocs', 'ปลอมเอกสาร'], ['offenseProperty', 'ทรัพย์'], ['offenseSex', 'เพศ'], ['offenseLife', 'ชีวิต/ร่างกาย'],
    ['offenseCom', 'ฉ้อโกงออนไลน์']
];

const TRAFFIC_SHORT = [
    ['trafficSpeed', 'ขับเร็ว'], ['trafficSign', 'ฝ่าป้าย'], ['trafficLight', 'ฝ่าไฟแดง'], ['trafficNotKeepLeft', 'ไม่ชิดซ้าย'],
    ['trafficNotCovered', 'ไม่ปกคลุม'], ['trafficModify', 'ดัดแปลงรถ'], ['trafficNoPart', 'ส่วนควบไม่ครบ'],
    ['trafficTax', 'ขาดภาษี/พ.ร.บ.'], ['trafficNoPlate', 'ไม่ติดป้ายทะเบียน']
];

// Top `n` non-zero categories by count, then "อื่นๆ" for whatever is left of `total`
const topWithOther = (s, labels, total, n = 3) => {
    const top = labels.map(([k, label]) => ({ label, value: s[k] || 0 }))
        .filter(i => i.value > 0).sort((a, b) => b.value - a.value).slice(0, n);
    const rest = total - top.reduce((sum, i) => sum + i.value, 0);
    return rest > 0 ? [...top, { label: 'อื่นๆ', value: rest }] : top;
};

// Short LINE morning message: s = one day's counts, dateText e.g. "9 ต.ค.69"
export const buildLineText = ({ s, commander, unitName, dateText }) => {
    const fmt = (num) => Number(num || 0).toLocaleString('en-US');
    const pair = (i) => `${i.label} ${fmt(i.value)}`;
    const seized = s.seized || {};
    const g = (group, key) => seized[group]?.[key] || 0;

    const offenses = topWithOther(s, OFFENSE_SHORT, s.flagrantTotal || 0).map(pair).join(' / ');
    const traffic = topWithOther(s, TRAFFIC_SHORT, s.trafficTotal || 0).map(pair);
    const trafficLines = [];
    for (let i = 0; i < traffic.length; i += 2) trafficLines.push(traffic.slice(i, i + 2).join(' / '));

    const seizedText = [
        ['ยาบ้า', g('drugs', 'yaba'), ' เม็ด'], ['ไอซ์', g('drugs', 'ice'), ' กรัม'],
        ['เคตามีน', g('drugs', 'ketamine'), ' กรัม'], ['โคเคน', g('drugs', 'other'), ' กรัม'],
        ['ปืน', g('guns', 'registered') + g('guns', 'unregistered'), ''], ['กระสุน', g('guns', 'bullets'), ''],
        ['วัตถุระเบิด', g('guns', 'explosives'), ''], ['รถยนต์', g('vehicles', 'car'), ''],
        ['จยย.', g('vehicles', 'bike'), ''], ['เงินสด', g('others', 'money'), ' บาท'],
        ['บัญชี', g('others', 'account'), ''], ['โทรศัพท์', g('others', 'phone'), ''],
        ['อุปกรณ์อิเล็กทรอนิกส์', g('others', 'electronics'), ''], ['สินค้าหนีภาษี', g('others', 'dutyFree'), ''],
        ['อื่นๆ', g('others', 'items'), '']
    ].filter(([, v]) => v > 0).map(([label, v, unit]) => `${label} ${fmt(v)}${unit}`).join(' / ') || 'ไม่มี';

    return `เรียน ผู้บังคับบัญชา

📍ภายใต้การอำนวยการของ
${commander}
รายงานผลการปฏิบัติ ${unitName}
🗓️ ${dateText}

🚨 คดีอาญา ${fmt(s.criminalTotal)} ราย
(ซึ่งหน้า ${fmt(s.flagrantTotal)} / หมายจับ ${fmt(s.warrantTotal)})${offenses ? `\n${offenses}` : ''}

⭐ เหตุการณ์ที่น่าสนใจ
1. ไม่มี

🚦 คดีจราจร ${fmt(s.trafficTotal)} ราย${trafficLines.length ? `\n${trafficLines.join('\n')}` : ''}

🚓 นำขบวน ${fmt(s.convoyTotal)} ขบวน
💥 อุบัติเหตุ ${fmt(s.accidentsTotal)} ครั้ง (ตาย ${fmt(s.accidentsDeath)} เจ็บ ${fmt(s.accidentsInjured)})
📦 ของกลาง: ${seizedText}
🤝 จิตอาสา ${fmt(s.volunteerTotal)} / บริการ ปชช. ${fmt(s.serviceTotal)}

จึงเรียนมาเพื่อโปรดทราบ`;
};
