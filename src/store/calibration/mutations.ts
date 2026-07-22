import { MutationTree } from 'vuex'
import { CalibrationState, PidResult } from '@/store/calibration/types'

export const mutations: MutationTree<CalibrationState> = {
    setPidStatus(
    state,
    payload: { heater: 'pidHotend' | 'pidBed'; status: CalibrationState['pidHotend']['status']; startedAt?: number | null })
    {
    state[payload.heater].status = payload.status
    if (payload.startedAt !== undefined) state[payload.heater].startedAt = payload.startedAt
},
    setPidTargetTemp(state, payload: { heater: 'pidHotend' | 'pidBed'; targetTemp: number }) {
        state[payload.heater].targetTemp = payload.targetTemp
    },
    setPidResult(state, payload: { heater: 'pidHotend' | 'pidBed'; result: PidResult }) {
        state[payload.heater].result = payload.result
        state[payload.heater].status = 'success'
        state[payload.heater].errorMessage = null
    },
    setPidError(state, payload: { heater: 'pidHotend' | 'pidBed'; message: string }) {
        state[payload.heater].status = 'error'
        state[payload.heater].errorMessage = payload.message
    },
}
