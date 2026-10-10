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
