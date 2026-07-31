// Builds a URL for Tesla's own (undocumented but widely used — TeslaMate,
// TeslaFi, teslahunt/tesla-images) vehicle image compositor, so the app can
// show the exact real vehicle (model, paint, wheels) instead of a generic
// icon. Ported from teslahunt/tesla-images (MIT), which the compositor's
// filtering rules and view-angle logic are verified against real vehicles
// (its test suite has snapshots for 3/Y/S/X across model years) — not
// guessed from the endpoint's undocumented behavior.
const VIEW_ANGLES = ["STUD_3QTR", "STUD_SEAT"];
const VIEW_ANGLES_OLD = ["STUD_3QTR", "STUD_SEAT_ALTA"];
const VIEW_ANGLES_V2 = ["STUD_3QTR_V2", "STUD_SEAT_V2"];

const PAINT_CODES = [
  "PBCW", "PBSB", "PMAB", "PMBL", "PMMB", "PMNG", "PMSG", "PMSS", "PMTG",
  "PN00", "PN01", "PPMR", "PPSB", "PPSR", "PPSW", "PPTI", "PR00", "PR01",
];
const HAND_DRIVE = ["DRLH", "DRRH"];
const M3_GENERIC_CODES = ["MT3", "W3", "W4"];
// Models before the heat pump refresh around October 2020.
const M3_NON_REFRESH = ["MT30", "MT31", "MT336"];
const M3_INTERIOR_CODES = [
  "IN3PB", "IN3PW", "INBBW", "INBFP", "INBPP", "INBPW", "INBTB", "INFBP",
  "INLPC", "INLPP", "INWPT", "INYPB", "INYPW", "IPB0", "IPB1", "IPW0",
  "IPW1", "IVBPP", "IVBSW", "IVBTB", "IVLPC", "QPBT", "QTFC", "QTFP",
  "QTFW", "QTPB", "QTPC", "QTPP", "QTPT", "QTTB", "QTWS", "QXMB",
  "IBB0", "IBB1", "IBW0", "IBW1", // new
  "IPB2", "IPB3", "IPB4", "IPW2", "IPW3", "IPW4", // highland
];
const M3_OPTIONS_CODES = [...M3_GENERIC_CODES, ...HAND_DRIVE, ...PAINT_CODES, ...M3_INTERIOR_CODES];
const MY_GENERIC_OPTIONS_CODES = ["MTY", "WY1", "WY2"];
const MY_INTERIOR_CODES = ["IN"];
const MY_OPTIONS_CODES = [...MY_GENERIC_OPTIONS_CODES, ...HAND_DRIVE, ...PAINT_CODES, ...MY_INTERIOR_CODES];

type ModelCode = "m3" | "my" | "ms" | "mx";

function test(item: string, pattern: string | RegExp): boolean {
  return pattern instanceof RegExp ? pattern.test(item) : item.startsWith(pattern);
}

function has(collection: string[], pattern: string | RegExp): boolean {
  return collection.some((item) => test(item, pattern));
}

function pick(orig: string[], patterns: string[]): string[] {
  return orig.filter((item) => patterns.some((pattern) => test(item, pattern)));
}

function isFirstGeneration(optionCodes: string[]): boolean {
  return optionCodes.includes("MI00") || !has(optionCodes, "MI0");
}

function getOptions(optionCodes: string[], model: ModelCode): string[] {
  switch (model) {
    case "m3": {
      const picked = pick(optionCodes, M3_OPTIONS_CODES);
      const hasInterior = M3_INTERIOR_CODES.some((code) => has(picked, code));
      if (hasInterior) return picked;

      const isRefresh = has(optionCodes, "MT") && !M3_NON_REFRESH.some((code) => has(optionCodes, code));
      return [isRefresh ? "IBB1" : "IN3PB", ...picked];
    }
    case "my":
      return pick(optionCodes, MY_OPTIONS_CODES);
    case "ms":
    case "mx": {
      const isRefresh = has(optionCodes, "ST0Y");
      return isRefresh ? optionCodes.filter((code) => !/IC..$/.test(code)) : optionCodes;
    }
    default:
      return optionCodes;
  }
}

function getViewAngle(optionCodes: string[], model: ModelCode): string {
  if (model === "my" || model === "m3") return VIEW_ANGLES[0];
  if (model === "mx") return has(optionCodes, "MTX") ? VIEW_ANGLES_V2[0] : VIEW_ANGLES[0];
  if (model === "ms") {
    if (has(optionCodes, "MTS")) return VIEW_ANGLES_V2[0];
    return isFirstGeneration(optionCodes) ? VIEW_ANGLES[0] : VIEW_ANGLES_OLD[0];
  }
  return VIEW_ANGLES[0];
}

const CAR_TYPE_TO_MODEL_CODE: Record<string, ModelCode> = {
  model3: "m3",
  modely: "my",
  models: "ms",
  modelx: "mx",
};

// Returns null for car types the compositor doesn't support (Cybertruck —
// not covered by the ported logic above) rather than guessing at a URL that
// might not render.
export function buildVehicleImageUrl(carType: string, optionCodesRaw: string | undefined): string | null {
  const model = CAR_TYPE_TO_MODEL_CODE[carType];
  if (!model || !optionCodesRaw) return null;

  const optionCodes = optionCodesRaw.split(",").map((code) => code.trim()).filter(Boolean);
  const url = new URL("https://static-assets.tesla.com/configurator/compositor");
  // Params (bkba_opt/file_type included) kept exactly as the verified
  // reference uses them, not guessed — untested deviations here risk a
  // blank/wrong image with no error to debug from.
  url.searchParams.set("bkba_opt", "2");
  url.searchParams.set("file_type", "jpg");
  url.searchParams.set("model", model);
  url.searchParams.set("options", getOptions(optionCodes, model).sort().join(","));
  url.searchParams.set("view", getViewAngle(optionCodes, model));
  url.searchParams.set("size", "800");
  return url.toString();
}
