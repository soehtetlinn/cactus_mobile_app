// Client for the cactus_mobile connector app on ERPNext (cactus_mobile/api/v1.py).
// Every call goes to /api/method/cactus_mobile.api.v1.<name>; signed-in calls send
// "Authorization: token <api_key>:<api_secret>".

export type Shift = { name: string; start: string; end: string };

export type Employee = {
  name: string;
  employee_name: string;
  first_name: string;
  company: string;
  department: string | null;
  designation: string | null;
  image: string | null;
  date_of_joining: string | null;
  cell_number: string | null;
  company_email: string | null;
  user_id: string;
  currency: string;
  shift: Shift | null;
};

export type LogType = 'IN' | 'OUT';

export type Checkin = {
  name: string;
  log_type: LogType;
  time: string;
  latitude: number | null;
  longitude: number | null;
};

export type CheckinStatus = {
  today: Checkin[];
  next_action: LogType;
  shift: Shift | null;
  location_required: number;
  max_gps_accuracy: number;
  server_time: string;
};

export type AttendanceStatus = 'Present' | 'Absent' | 'On Leave' | 'Half Day' | 'Work From Home';

export type AttendanceDay = {
  attendance_date: string;
  status: AttendanceStatus;
  working_hours: number;
  late_entry: number;
  early_exit: number;
  in_time: string | null;
  out_time: string | null;
  leave_type: string | null;
  shift: string | null;
};

export type Holiday = { holiday_date: string; description: string; weekly_off: number };

export type AttendanceMonth = {
  month: string;
  days: AttendanceDay[];
  holidays: Holiday[];
  summary: {
    present: number;
    absent: number;
    half_day: number;
    on_leave: number;
    work_from_home: number;
    late: number;
    hours: number;
  };
};

export type LeaveBalance = {
  leave_type: string;
  allocated: number;
  taken: number;
  pending: number;
  remaining: number;
  without_pay: number;
};

export type LeaveStatus = 'Open' | 'Approved' | 'Rejected' | 'Cancelled';

export type LeaveApplication = {
  name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  half_day: number;
  total_leave_days: number;
  status: LeaveStatus;
  docstatus: number;
  description: string | null;
  posting_date: string;
};

export type SalarySlip = {
  name: string;
  start_date: string;
  end_date: string;
  posting_date: string;
  currency: string;
  gross_pay: number;
  total_deduction: number;
  net_pay: number;
};

export type ExpenseClaim = {
  name: string;
  posting_date: string;
  currency: string;
  total_claimed_amount: number;
  total_sanctioned_amount: number;
  status: string;
  approval_status: string;
  docstatus: number;
};

export type AppConfig = {
  api_version: number;
  enabled: number;
  min_app_version: string | null;
  app_name: string | null;
  logo: string | null;
};

export type ApplyLeaveInput = {
  leave_type: string;
  from_date: string;
  to_date: string;
  half_day?: number;
  half_day_date?: string;
  reason?: string;
};

export type ExpenseInput = {
  expense_type: string;
  amount: number;
  expense_date: string;
  description?: string;
  receipt?: string;
  receipt_filename?: string;
};

/** A failed call. status 0 means the server could not be reached. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const METHOD_PREFIX = '/api/method/cactus_mobile.api.v1.';

/** Accepts "erp.example.com", "192.168.1.20:8000" or a full URL. */
export function normalizeServer(input: string): string {
  let url = input.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) {
    const local = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url);
    url = `${local ? 'http' : 'https'}://${url}`;
  }
  return url;
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

/** Frappe puts user-facing errors in _server_messages, a JSON list of JSON strings. */
function errorMessage(body: unknown, status: number): string {
  const data = (body ?? {}) as Record<string, unknown>;
  if (typeof data._server_messages === 'string') {
    try {
      const messages = (JSON.parse(data._server_messages) as string[]).map((raw) => {
        try {
          return String((JSON.parse(raw) as { message?: string }).message ?? raw);
        } catch {
          return raw;
        }
      });
      if (messages.length) return stripHtml(messages.join('\n'));
    } catch {
      // fall through to the other fields
    }
  }
  if (typeof data.message === 'string') return stripHtml(data.message);
  if (typeof data.exception === 'string') return stripHtml(data.exception.replace(/^[\w.]+:\s*/, ''));
  return `HTTP ${status}`;
}

export function createApi(server: string, token: string | null, onUnauthorized?: () => void) {
  const authHeaders: Record<string, string> = token ? { Authorization: `token ${token}` } : {};

  async function request<T>(
    method: 'GET' | 'POST',
    name: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    let url = `${server}${METHOD_PREFIX}${name}`;
    const init: RequestInit = { method, headers: { Accept: 'application/json', ...authHeaders } };

    if (method === 'GET' && params) {
      const query = Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      if (query) url += `?${query}`;
    } else if (method === 'POST') {
      init.headers = { ...init.headers, 'Content-Type': 'application/json' };
      init.body = JSON.stringify(params ?? {});
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch {
      throw new ApiError('network', 0);
    }

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      if (token && (response.status === 401 || response.status === 403)) onUnauthorized?.();
      throw new ApiError(errorMessage(body, response.status), response.status);
    }
    return (body as { message: T }).message;
  }

  return {
    server,
    authHeaders,
    appConfig: () => request<AppConfig>('GET', 'app_config'),
    login: (usr: string, pwd: string) =>
      request<{ token: string; employee: Employee }>('POST', 'login', { usr, pwd }),
    signOutAllDevices: () => request<{ ok: boolean }>('POST', 'sign_out_all_devices'),
    profile: () => request<Employee>('GET', 'profile'),

    checkinStatus: () => request<CheckinStatus>('GET', 'checkin_status'),
    checkin: (logType: LogType, coords?: { latitude: number; longitude: number; accuracy: number | null }) =>
      request<{ name: string; log_type: LogType; time: string }>('POST', 'checkin', {
        log_type: logType,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        accuracy: coords?.accuracy ?? undefined,
      }),

    attendance: (month: string) => request<AttendanceMonth>('GET', 'attendance', { month }),

    leaveBalances: () => request<LeaveBalance[]>('GET', 'leave_balances'),
    leaveApplications: () => request<LeaveApplication[]>('GET', 'leave_applications'),
    applyLeave: (input: ApplyLeaveInput) =>
      request<{ name: string; status: string; total_leave_days: number }>('POST', 'apply_leave', input),

    salarySlips: () => request<SalarySlip[]>('GET', 'salary_slips'),
    /** URL of a payslip PDF; download it with authHeaders. */
    salarySlipPdfUrl: (name: string) => `${server}${METHOD_PREFIX}salary_slip_pdf?name=${encodeURIComponent(name)}`,

    expenseClaimTypes: () => request<string[]>('GET', 'expense_claim_types'),
    expenseClaims: () => request<ExpenseClaim[]>('GET', 'expense_claims'),
    submitExpenseClaim: (input: ExpenseInput) =>
      request<{ name: string; status: string; total_claimed_amount: number }>(
        'POST',
        'submit_expense_claim',
        input,
      ),
  };
}

export type Api = ReturnType<typeof createApi>;
