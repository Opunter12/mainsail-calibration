import { GetterTree } from 'vuex'
import { CalibrationState } from '@/store/calibration/types'
import { RootState } from '@/store/types'

export const getters: GetterTree<CalibrationState, RootState> = {
    getPidHotend: (state) => state.pidHotend,
    getPidBed: (state) => state.pidBed,
}
