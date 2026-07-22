<template>
    <div>
        <h1>{{ $t('Calibration.Title') }}</h1>
        <pid-calibration-panel heater="extruder" :title="$t('Calibration.Pid.HotendTitle')" :other-running="isAnyCalibrationRunning && !isHotendRunning" />
        <pid-calibration-panel heater="heater_bed" :title="$t('Calibration.Pid.BedTitle')" :other-running="isAnyCalibrationRunning && !isBedRunning" />
    </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import PidCalibrationPanel from '@/components/panels/Calibration/PidCalibrationPanel.vue'

@Component({
    components: { PidCalibrationPanel },
})
export default class PageCalibration extends Mixins(BaseMixin) {

    get isHotendRunning(): boolean {
        return this.$store.getters['calibration/getPidHotend'].status === 'running'
    }

    get isBedRunning(): boolean {
        return this.$store.getters['calibration/getPidBed'].status === 'running'
    }

    get isAnyCalibrationRunning(): boolean {
        return this.isHotendRunning || this.isBedRunning
    }

}
</script>
