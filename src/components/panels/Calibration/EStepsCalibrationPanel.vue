<template>
    <v-card class="mb-4">
        <v-card-title>
            <v-icon left>{{ mdiRulerSquareCompass }}</v-icon>
            {{ $t('Calibration.ESteps.Title') }}
        </v-card-title>
        <v-card-text>
            <p class="text--secondary mb-3">{{ $t('Calibration.ESteps.Description') }}</p>
            <!-- IDLE -->
            <template v-if="status === 'idle'">
                <v-row>
                    <v-col cols="12" sm="4">
                        <v-text-field
                            v-model.number="targetTemp"
                            type="number"
                            :label="$t('Calibration.ESteps.TargetTemp')"
                            suffix="°C"
                            dense />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field
                            v-model.number="requestedDistance"
                            type="number"
                            :label="$t('Calibration.ESteps.RequestedDistance')"
                            suffix="mm"
                            dense />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field
                            v-model.number="feedRate"
                            type="number"
                            :label="$t('Calibration.ESteps.FeedRate')"
                            suffix="mm/min"
                            dense />
                    </v-col>
                </v-row>
                <v-btn color="primary" @click="startHeating">
                    <v-icon left>{{ mdiPlay }}</v-icon>
                    {{ $t('Calibration.ESteps.Start') }}
                </v-btn>
            </template>

            <!-- HEATING -->
            <v-alert v-else-if="status === 'heating'" type="info" dense>
                <v-progress-circular indeterminate size="20" class="mr-2" />
                {{ $t('Calibration.ESteps.Heating', { temp: targetTemp }) }}
            </v-alert>

        <!-- READY TO MARK -->
        <template v-else-if="status === 'readyToMark'">
            <v-alert type="info" dense>{{ $t('Calibration.ESteps.MarkInstructions') }}</v-alert>
            <v-text-field
                v-model.number="initialMarkDistanceLocal"
                type="number"
                :label="$t('Calibration.ESteps.InitialMarkDistance')"
                suffix="mm"
                dense />
            <v-btn color="primary" :disabled="initialMarkDistanceLocal === null" @click="startExtruding">
                {{ $t('Calibration.ESteps.ConfirmMarked') }}
            </v-btn>
        </template>

            <!-- EXTRUDING -->
            <v-alert v-else-if="status === 'extruding'" type="info" dense>
                <v-progress-circular indeterminate size="20" class="mr-2" />
                {{ $t('Calibration.ESteps.Extruding') }}
            </v-alert>

            <!-- AWAITING MEASUREMENT -->
            <template v-else-if="status === 'awaitingMeasurement'">
                <v-alert type="info" dense>{{ $t('Calibration.ESteps.MeasureInstructions') }}</v-alert>
                <v-text-field
                    v-model.number="finalMarkDistanceLocal"
                    type="number"
                    :label="$t('Calibration.ESteps.FinalMarkDistance')"
                    suffix="mm"
                    dense />
                <v-btn color="primary" :disabled="finalMarkDistanceLocal === null" @click="calculate">
                    {{ $t('Calibration.ESteps.Calculate') }}
                </v-btn>
            </template>

            <!-- CALCULATED / REVIEW -->
            <template v-else-if="status === 'calculated'">
                <v-alert type="success" dense>
                    {{
                        $t('Calibration.ESteps.Result', {
                            actual: actualExtrudeDistance,
                            current: eStepsState.currentRotationDistance,
                            proposed: eStepsState.newRotationDistance,
                        })
                    }}
                </v-alert>
                <v-btn color="primary" @click="confirmAndSave">
                    <v-icon left>{{ mdiContentSave }}</v-icon>
                    {{ $t('Calibration.ESteps.ApplyAndSave') }}
                </v-btn>
                <v-btn text @click="reset">{{ $t('Buttons.Cancel') }}</v-btn>
            </template>

            <!-- SAVING -->
            <v-alert v-else-if="status === 'saving'" type="info" dense>
                <v-progress-circular indeterminate size="20" class="mr-2" />
                {{ $t('Calibration.ESteps.Saving') }}
            </v-alert>

            <!-- SUCCESS -->
            <template v-else-if="status === 'success'">
                <v-alert type="success" dense>{{ $t('Calibration.ESteps.SaveSuccess') }}</v-alert>
                <v-btn text @click="reset">{{ $t('Calibration.ESteps.RunAgain') }}</v-btn>
            </template>

            <!-- ERROR -->
            <template v-else-if="status === 'error'">
                <v-alert type="error" dense>{{ eStepsState.errorMessage }}</v-alert>
                <v-btn text @click="reset">{{ $t('Buttons.Cancel') }}</v-btn>
            </template>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Mixins} from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiRulerSquareCompass, mdiPlay, mdiContentSave } from '@mdi/js'
import { EStepsState, EStepsStatus } from '@/store/calibration/types'
import { fetchPrinterConfig, replaceExtruderRotationDistance, savePrinterConfig } from '@/plugins/configFileEditor'

@Component
export default class EStepsCalibrationPanel extends Mixins(BaseMixin) {
    mdiRulerSquareCompass = mdiRulerSquareCompass
    mdiPlay = mdiPlay
    mdiContentSave = mdiContentSave

    get eStepsState(): EStepsState {
        return this.$store.state.calibration.eSteps
    }

    get status(): EStepsStatus {
        return this.eStepsState.status
    }

    get targetTemp(): number {
        return this.eStepsState.targetTemp
    }
    set targetTemp(value: number) {
        this.setField('targetTemp', value)
    }

    get requestedDistance(): number {
        return this.eStepsState.requestedDistance
    }
    set requestedDistance(value: number) {
        this.setField('requestedDistance', value)
    }

    get feedRate(): number {
        return this.eStepsState.feedRate
    }
    set feedRate(value: number) {
        this.setField('feedRate', value)
    }

    get initialMarkDistanceLocal(): number | null {
        return this.eStepsState.initialMarkDistance
    }
    set initialMarkDistanceLocal(value: number | null) {
        this.setField('initialMarkDistance', value)
    }

    get finalMarkDistanceLocal(): number | null {
        return this.eStepsState.finalMarkDistance
    }
    set finalMarkDistanceLocal(value: number | null) {
        this.setField('finalMarkDistance', value)
    }

    get actualExtrudeDistance(): number {
        const initial = this.eStepsState.initialMarkDistance ?? 0
        const final = this.eStepsState.finalMarkDistance ?? 0
        return Math.round((initial - final) * 100) / 100
    }

    setField<K extends keyof EStepsState>(field: K, value: EStepsState[K]): void {
        this.$store.commit('calibration/setEStepsField', { field, value })
    }

    async startHeating(): Promise<void> {
        this.$store.commit('calibration/setEStepsStatus', 'heating')

        const currentRotationDistance =
            this.$store.state.printer?.configfile?.settings?.extruder?.rotation_distance ?? null
        this.setField('currentRotationDistance', currentRotationDistance)

        const gcode = `M109 S${this.targetTemp}`
        this.$store.dispatch('server/addEvent', { message: gcode, type: 'command' })

        try {
            await this.$socket.emitAndWait('printer.gcode.script', { script: gcode }, { loading: 'eStepsHeating' })
            this.$store.commit('calibration/setEStepsStatus', 'readyToMark')
        } catch {
            this.setField('errorMessage', 'Heating failed or was interrupted.')
            this.$store.commit('calibration/setEStepsStatus', 'error')
        }
    }

    async startExtruding(): Promise<void> {
        this.$store.commit('calibration/setEStepsStatus', 'extruding')

        const gcode = `M83\nG1 E${this.requestedDistance} F${this.feedRate}\nM400\nM82`
        this.$store.dispatch('server/addEvent', { message: gcode, type: 'command' })

        try {
            await this.$socket.emitAndWait('printer.gcode.script', { script: gcode }, { loading: 'eStepsExtruding' })
            this.$store.commit('calibration/setEStepsStatus', 'awaitingMeasurement')
        } catch {
            this.setField('errorMessage', 'Extrusion failed or was interrupted.')
            this.$store.commit('calibration/setEStepsStatus', 'error')
        }
    }

    calculate(): void {
        const current = this.eStepsState.currentRotationDistance ?? 0
        const newValue = (current * this.actualExtrudeDistance) / this.requestedDistance
        this.setField('newRotationDistance', Math.round(newValue * 1000) / 1000)
        this.$store.commit('calibration/setEStepsStatus', 'calculated')
    }

    async confirmAndSave(): Promise<void> {
        this.$store.commit('calibration/setEStepsStatus', 'saving')
        try {
            const apiUrl = this.$store.getters['socket/getUrl']
            const currentText = await fetchPrinterConfig(apiUrl)
            const newText = replaceExtruderRotationDistance(currentText, this.eStepsState.newRotationDistance ?? 0)
            await savePrinterConfig(apiUrl, newText)

            const restartGcode = 'RESTART'
            this.$store.dispatch('server/addEvent', { message: restartGcode, type: 'command' })
            this.$socket.emit('printer.gcode.script', { script: restartGcode })

            this.$store.commit('calibration/setEStepsStatus', 'success')
        } catch (error) {
            this.setField('errorMessage', error instanceof Error ? error.message : String(error))
            this.$store.commit('calibration/setEStepsStatus', 'error')
        }
    }

    reset(): void {
        if (this.countdownInterval) clearInterval(this.countdownInterval)
        this.$store.commit('calibration/resetESteps')
    }

}
</script>
