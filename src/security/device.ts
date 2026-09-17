export interface DeviceReport {
  userAgent: string
  platform: string
  logicalCores: number | null
  deviceMemoryGb: number | null
  webGpu: boolean
  webAssembly: boolean
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

export function collectDeviceReport(): DeviceReport {
  const browserNavigator = navigator as NavigatorWithMemory
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    logicalCores: navigator.hardwareConcurrency ?? null,
    deviceMemoryGb: browserNavigator.deviceMemory ?? null,
    webGpu: 'gpu' in navigator,
    webAssembly: typeof WebAssembly === 'object',
  }
}
