import { Module } from 'vuex'
import { actions } from '@/store/calibration/actions'
import { mutations } from '@/store/calibration/mutations'
import { getters } from '@/store/calibration/getters'
import { CalibrationState } from '@/store/calibration/types'
import { RootState } from '@/store/types'

export const getDefaultState = (): CalibrationState => {
    return {
        pidHotend: { status: 'idle', targetTemp: 210, result: null, errorMessage: null, startedAt: null },
        pidBed: { status: 'idle', targetTemp: 60, result: null, errorMessage: null, startedAt: null },
        eSteps: {
            status: 'idle',
            targetTemp: 210,
            requestedDistance: 50,
            feedRate: 60,
            initialMarkDistance: null,
            finalMarkDistance: null,
            currentRotationDistance: null,
            newRotationDistance: null,
            errorMessage: null,
        },
    }
}

const state = getDefaultState()

export const calibration: Module<CalibrationState, RootState> = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
