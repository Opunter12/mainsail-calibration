<template>
    <div>
        <h1>{{ $t('Calibration.Title') }}</h1>
        <pid-calibration-panel heater="extruder" :title="$t('Calibration.Pid.HotendTitle')" />
        <pid-calibration-panel heater="heater_bed" :title="$t('Calibration.Pid.BedTitle')" />
    </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import PidCalibrationPanel from '@/components/panels/Calibration/PidCalibrationPanel.vue'

@Component({
    components: { PidCalibrationPanel },
})
export default class PageCalibration extends Mixins(BaseMixin) {}
</script>
