import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getItem, setItem } from '@/lib/storage';

const en = {
  'app.name': 'Cactus Employee',

  'login.title': 'Sign in',
  'login.subtitle': 'Use the email and password you use for ERPNext.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.server': 'Server address',
  'login.serverHint': 'Ask HR if you are not sure.',
  'login.submit': 'Sign in',
  'login.showServer': 'Change server',

  'tabs.home': 'Home',
  'tabs.attendance': 'Attendance',
  'tabs.leave': 'Leave',
  'tabs.pay': 'Pay',
  'tabs.profile': 'Profile',

  'home.greeting': 'Hello, {name}',
  'home.shift': 'Shift {name}',
  'home.noShift': 'No shift assigned',
  'home.notCheckedIn': 'Not checked in yet today',
  'home.checkedInAt': 'Checked in at {time}',
  'home.checkedOutAt': 'Checked out at {time}',
  'home.checkIn': 'Check in',
  'home.checkOut': 'Check out',
  'home.locating': 'Finding your location…',
  'home.today': "Today's log",
  'home.noLogs': 'No check-ins yet today.',
  'home.in': 'In',
  'home.out': 'Out',
  'home.done': 'Saved: {action} at {time}',
  'home.locationDenied': 'Location permission is needed to check in. Allow it in your phone settings.',
  'home.locationNote': 'Your location is saved with each check-in.',

  'attendance.present': 'Present',
  'attendance.late': 'Late',
  'attendance.absent': 'Absent',
  'attendance.leave': 'Leave',
  'attendance.hours': 'Hours',
  'attendance.holiday': 'Holiday',
  'attendance.weeklyOff': 'Day off',
  'attendance.noRecord': 'No record',
  'attendance.halfDay': 'Half day',
  'attendance.wfh': 'Work from home',
  'attendance.earlyExit': 'Left early',
  'attendance.empty': 'No attendance this month yet.',

  'leave.balances': 'Leave balance',
  'leave.daysLeft': '{n} of {total} days left',
  'leave.pending': '{n} pending',
  'leave.withoutPay': 'Unpaid leave',
  'leave.apply': 'Apply for leave',
  'leave.history': 'My requests',
  'leave.empty': 'No leave requests yet.',
  'leave.days': '{n} days',
  'leave.day': '1 day',
  'leave.halfDay': 'Half day',
  'leave.type': 'Leave type',
  'leave.from': 'From',
  'leave.to': 'To',
  'leave.reason': 'Reason',
  'leave.submit': 'Send request',
  'leave.sent': 'Request {name} sent to your approver.',
  'leave.status.Open': 'Waiting',
  'leave.status.Approved': 'Approved',
  'leave.status.Rejected': 'Rejected',
  'leave.status.Cancelled': 'Cancelled',

  'pay.payslips': 'Payslips',
  'pay.expenses': 'Expenses',
  'pay.net': 'Net pay',
  'pay.gross': 'Gross {amount}',
  'pay.deductions': 'Deductions {amount}',
  'pay.noPayslips': 'No payslips yet.',
  'pay.open': 'Open PDF',
  'pay.newClaim': 'New expense claim',
  'pay.noClaims': 'No expense claims yet.',
  'pay.claimType': 'Expense type',
  'pay.amount': 'Amount',
  'pay.date': 'Date',
  'pay.description': 'Description',
  'pay.receipt': 'Receipt photo',
  'pay.takePhoto': 'Take photo',
  'pay.choosePhoto': 'Choose photo',
  'pay.removePhoto': 'Remove',
  'pay.submitClaim': 'Send claim',
  'pay.claimSent': 'Claim {name} sent for approval.',
  'pay.claimed': 'Claimed {amount}',
  'pay.status.Draft': 'Waiting',
  'pay.status.Unpaid': 'Approved',
  'pay.status.Paid': 'Paid',
  'pay.status.Rejected': 'Rejected',
  'pay.status.Cancelled': 'Cancelled',

  'profile.employeeId': 'Employee ID',
  'profile.designation': 'Position',
  'profile.department': 'Department',
  'profile.company': 'Company',
  'profile.joined': 'Joined',
  'profile.email': 'Email',
  'profile.language': 'Language',
  'profile.server': 'Server',
  'profile.signOut': 'Sign out',
  'profile.signOutAll': 'Sign out on all devices',
  'profile.signOutAllConfirm': 'You will need to sign in again on every phone. Continue?',

  'common.cancel': 'Cancel',
  'common.ok': 'OK',
  'common.retry': 'Try again',
  'common.required': 'Please fill in {field}.',
  'errors.network': "Can't reach the server. Check your internet connection and the server address.",
  'errors.generic': 'Something went wrong. Please try again.',
};

export type TranslationKey = keyof typeof en;

const th: Record<TranslationKey, string> = {
  'app.name': 'Cactus Employee',

  'login.title': 'เข้าสู่ระบบ',
  'login.subtitle': 'ใช้อีเมลและรหัสผ่านเดียวกับที่ใช้เข้า ERPNext',
  'login.email': 'อีเมล',
  'login.password': 'รหัสผ่าน',
  'login.server': 'ที่อยู่เซิร์ฟเวอร์',
  'login.serverHint': 'หากไม่แน่ใจ โปรดสอบถามฝ่ายบุคคล',
  'login.submit': 'เข้าสู่ระบบ',
  'login.showServer': 'เปลี่ยนเซิร์ฟเวอร์',

  'tabs.home': 'หน้าหลัก',
  'tabs.attendance': 'การเข้างาน',
  'tabs.leave': 'การลา',
  'tabs.pay': 'เงินเดือน',
  'tabs.profile': 'โปรไฟล์',

  'home.greeting': 'สวัสดี คุณ{name}',
  'home.shift': 'กะ {name}',
  'home.noShift': 'ยังไม่ได้กำหนดกะทำงาน',
  'home.notCheckedIn': 'วันนี้ยังไม่ได้ลงเวลาเข้างาน',
  'home.checkedInAt': 'ลงเวลาเข้างานเมื่อ {time}',
  'home.checkedOutAt': 'ลงเวลาออกงานเมื่อ {time}',
  'home.checkIn': 'ลงเวลาเข้างาน',
  'home.checkOut': 'ลงเวลาออกงาน',
  'home.locating': 'กำลังค้นหาตำแหน่งของคุณ…',
  'home.today': 'บันทึกวันนี้',
  'home.noLogs': 'วันนี้ยังไม่มีการลงเวลา',
  'home.in': 'เข้า',
  'home.out': 'ออก',
  'home.done': 'บันทึกแล้ว: {action} เวลา {time}',
  'home.locationDenied': 'ต้องอนุญาตการเข้าถึงตำแหน่งเพื่อลงเวลา โปรดเปิดในการตั้งค่าโทรศัพท์',
  'home.locationNote': 'ระบบจะบันทึกตำแหน่งของคุณทุกครั้งที่ลงเวลา',

  'attendance.present': 'มาทำงาน',
  'attendance.late': 'สาย',
  'attendance.absent': 'ขาดงาน',
  'attendance.leave': 'ลา',
  'attendance.hours': 'ชั่วโมง',
  'attendance.holiday': 'วันหยุด',
  'attendance.weeklyOff': 'วันหยุดประจำสัปดาห์',
  'attendance.noRecord': 'ไม่มีบันทึก',
  'attendance.halfDay': 'ครึ่งวัน',
  'attendance.wfh': 'ทำงานที่บ้าน',
  'attendance.earlyExit': 'ออกก่อนเวลา',
  'attendance.empty': 'เดือนนี้ยังไม่มีข้อมูลการเข้างาน',

  'leave.balances': 'วันลาคงเหลือ',
  'leave.daysLeft': 'เหลือ {n} จาก {total} วัน',
  'leave.pending': 'รออนุมัติ {n} วัน',
  'leave.withoutPay': 'ลาไม่รับค่าจ้าง',
  'leave.apply': 'ขอลา',
  'leave.history': 'คำขอของฉัน',
  'leave.empty': 'ยังไม่มีคำขอลา',
  'leave.days': '{n} วัน',
  'leave.day': '1 วัน',
  'leave.halfDay': 'ครึ่งวัน',
  'leave.type': 'ประเภทการลา',
  'leave.from': 'ตั้งแต่วันที่',
  'leave.to': 'ถึงวันที่',
  'leave.reason': 'เหตุผล',
  'leave.submit': 'ส่งคำขอ',
  'leave.sent': 'ส่งคำขอ {name} ถึงผู้อนุมัติแล้ว',
  'leave.status.Open': 'รออนุมัติ',
  'leave.status.Approved': 'อนุมัติแล้ว',
  'leave.status.Rejected': 'ไม่อนุมัติ',
  'leave.status.Cancelled': 'ยกเลิก',

  'pay.payslips': 'สลิปเงินเดือน',
  'pay.expenses': 'เบิกค่าใช้จ่าย',
  'pay.net': 'รายได้สุทธิ',
  'pay.gross': 'รายได้รวม {amount}',
  'pay.deductions': 'รายการหัก {amount}',
  'pay.noPayslips': 'ยังไม่มีสลิปเงินเดือน',
  'pay.open': 'เปิด PDF',
  'pay.newClaim': 'เบิกค่าใช้จ่ายใหม่',
  'pay.noClaims': 'ยังไม่มีรายการเบิก',
  'pay.claimType': 'ประเภทค่าใช้จ่าย',
  'pay.amount': 'จำนวนเงิน',
  'pay.date': 'วันที่',
  'pay.description': 'รายละเอียด',
  'pay.receipt': 'รูปใบเสร็จ',
  'pay.takePhoto': 'ถ่ายรูป',
  'pay.choosePhoto': 'เลือกรูป',
  'pay.removePhoto': 'ลบ',
  'pay.submitClaim': 'ส่งเบิก',
  'pay.claimSent': 'ส่งรายการเบิก {name} เพื่ออนุมัติแล้ว',
  'pay.claimed': 'ยอดเบิก {amount}',
  'pay.status.Draft': 'รออนุมัติ',
  'pay.status.Unpaid': 'อนุมัติแล้ว',
  'pay.status.Paid': 'จ่ายแล้ว',
  'pay.status.Rejected': 'ไม่อนุมัติ',
  'pay.status.Cancelled': 'ยกเลิก',

  'profile.employeeId': 'รหัสพนักงาน',
  'profile.designation': 'ตำแหน่ง',
  'profile.department': 'แผนก',
  'profile.company': 'บริษัท',
  'profile.joined': 'วันที่เริ่มงาน',
  'profile.email': 'อีเมล',
  'profile.language': 'ภาษา',
  'profile.server': 'เซิร์ฟเวอร์',
  'profile.signOut': 'ออกจากระบบ',
  'profile.signOutAll': 'ออกจากระบบทุกอุปกรณ์',
  'profile.signOutAllConfirm': 'คุณจะต้องเข้าสู่ระบบใหม่ในทุกโทรศัพท์ ต้องการดำเนินการต่อหรือไม่?',

  'common.cancel': 'ยกเลิก',
  'common.ok': 'ตกลง',
  'common.retry': 'ลองอีกครั้ง',
  'common.required': 'โปรดกรอก{field}',
  'errors.network': 'ติดต่อเซิร์ฟเวอร์ไม่ได้ โปรดตรวจสอบอินเทอร์เน็ตและที่อยู่เซิร์ฟเวอร์',
  'errors.generic': 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง',
};

export type Language = 'th' | 'en';

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, th };

/** Locale for dates and money. th-TH shows Buddhist Era years, as Thai users expect. */
const intlLocales: Record<Language, string> = { th: 'th-TH', en: 'en-GB' };

const LANGUAGE_KEY = 'cactus.language';

type I18n = {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('th');

  useEffect(() => {
    getItem(LANGUAGE_KEY).then((saved) => {
      if (saved === 'th' || saved === 'en') setLanguageState(saved);
    });
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    setItem(LANGUAGE_KEY, next);
  }, []);

  const value = useMemo<I18n>(
    () => ({
      language,
      locale: intlLocales[language],
      setLanguage,
      t: (key, vars) =>
        Object.entries(vars ?? {}).reduce(
          (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
          dictionaries[language][key] ?? key,
        ),
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
