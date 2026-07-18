export type CalibrationStepStatus = 'idle' | 'running' | 'success' | 'error'

export interface PidResult {
    kp: number
    ki: number
    kd: number
}

export interface PidStepState {
    status: CalibrationStepStatus
    targetTemp: number
    result: PidResult | null
    errorMessage: string | null
}

export interface CalibrationState {
    pidHotend: PidStepState
    pidBed: PidStepState
}
