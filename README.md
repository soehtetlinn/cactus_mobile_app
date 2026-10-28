# Cactus Employee

Mobile app for Cactus Tree Co.,Ltd employees, in Thai and English. Built with Expo (SDK 58) and
React Native for Android and iOS.

| Tab | What employees can do |
|---|---|
| Home | Check in and check out with GPS, see today's shift and log |
| Attendance | Month view: present, late, absent, leave, hours, holidays |
| Leave | Leave balances, apply for leave, follow request status |
| Pay | Open payslip PDFs, send expense claims with a receipt photo |
| Profile | Employee details, language, sign out (this phone or all devices) |

It talks to ERPNext through the **cactus_mobile** Frappe app (a separate app installed on the
ERPNext site), never to ERPNext's own API directly. Business rules such as shift windows, GPS
requirements, office radius, leave balances and approvers stay in Frappe HR.

## Project layout

```
src/app/                 screens (Expo Router: every file is a route)
  login.tsx              sign in (email, password, server address)
  (tabs)/                Home, Attendance, Leave, Pay, Profile
  leave-apply.tsx        apply-for-leave form
  expense-new.tsx        new expense claim form
src/lib/api.ts           typed client for cactus_mobile.api.v1
src/lib/session.tsx      sign-in state; token kept in the Keychain / Keystore (expo-secure-store)
src/lib/i18n.tsx         Thai and English texts (Thai is the default)
src/lib/format.ts        dates (Buddhist Era years in Thai), times and money
src/components/          shared UI
src/theme.ts             brand colours, same as the ERPNext theme
assets/images/source/    SVG sources of the icons (logo is a placeholder: replace it)
```

## Run it during development

You need Node.js 22, or Docker. The commands below use Docker so nothing has to be installed on
Windows; with Node installed, run the part after `node:22-bookworm` directly.

```bash
docker run --rm -it -p 8081:8081 -v "D:\Projects\Dev\cactus-employee-app:/app" -v cactus_app_node_modules:/app/node_modules -w /app -e REACT_NATIVE_PACKAGER_HOSTNAME=<this PC's LAN IP> node:22-bookworm npx expo start
```

- **On a phone:** install **Expo Go** from the App Store or Play Store, connect to the same Wi-Fi
  as this PC, and scan the QR code. On the sign-in screen, enter the server as
  `http://<this PC's LAN IP>:8000`. The ERPNext dev container only listens on this PC by default:
  to reach it from a phone, change `127.0.0.1:8000-8005:8000-8005` to `8000-8005:8000-8005` in
  `D:\Projects\Dev\frappe_docker\.devcontainer\docker-compose.yml` and restart the containers.
- **In a browser:** add `--web`, open http://localhost:8081 and use `http://localhost:8000` as the
  server. The ERPNext dev site must allow the browser origin:
  `bench --site development.localhost set-config allow_cors "http://localhost:8081"`.
  Camera, GPS and file sharing behave differently in a browser; test those on a phone.

Checks to run before committing:

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Build the real app

Builds run in Expo's cloud with EAS, so no Android Studio or Xcode is needed:

```bash
npx eas-cli@latest build --platform android --profile preview
```

This needs a free Expo account. An Android `preview` build gives an `.apk` employees can install
directly; store releases need a Google Play developer account and, for iPhone, an Apple Developer
account. Before releasing:

- set `expo.extra.serverUrl` in `app.json` to the company's HTTPS address, so employees only type
  their email and password;
- replace the placeholder logo in `assets/images/source/` and re-render the PNGs;
- raise `version` in `app.json`, and set **Minimum app version** in ERPNext
  (Cactus Mobile Settings) when old versions must update.

## ERPNext setup the app relies on

- **Employee** linked to the person's **User** (the login), status Active.
- **HR Settings**: "Allow Employee Checkin from Mobile App" and, for GPS, "Allow Geolocation Tracking".
- **Shift Type** with auto attendance, given to employees as their default shift or a Shift
  Assignment. Add a **Shift Location** to the assignment to only accept check-ins near the office.
- **Holiday List Assignment** for the company (Frappe HR v16 reads holidays from here).
- **Leave Allocations**, **Salary Structure Assignments**, and default accounts on each
  **Expense Claim Type**, so leave, payslips and expense claims work.
- **Cactus Mobile Settings**: turn the app on or off, GPS accuracy limit, minimum app version.
