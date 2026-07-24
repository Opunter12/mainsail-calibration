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

export interface PidStepState {
    status: CalibrationStepStatus
    targetTemp: number
    result: PidResult | null
    errorMessage: string | null
    startedAt: number | null   // epoch ms, not a Date — plain primitives store/serialize more predictably
}


export type EStepsStatus =
    | 'idle'
    | 'heating'
    | 'readyToMark'
    | 'extruding'
    | 'awaitingMeasurement'
    | 'calculated'
    | 'saving'
    | 'success'
    | 'error'

export interface EStepsState {
    status: EStepsStatus
    targetTemp: number
    requestedDistance: number
    feedRate: number
    initialMarkDistance: number | null
    finalMarkDistance: number | null
    currentRotationDistance: number | null
    newRotationDistance: number | null
    errorMessage: string | null
}

export interface CalibrationState {
    pidHotend: PidStepState
    pidBed: PidStepState
    eSteps: EStepsState
}
