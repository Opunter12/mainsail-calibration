<template>
    <v-card class="mb-4">
        <v-card-title>
            <v-icon left>{{ mdiThermometer }}</v-icon>
            {{ title }}
        </v-card-title>
        <v-card-text>
            <v-row align="center">
                <v-col cols="12" sm="4">
                    <v-text-field
                        v-model.number="targetTempLocal"
                        type="number"
                        :label="$t('Calibration.Pid.TargetTemp')"
                        suffix="°C"
                        dense
                        hide-details
                        :disabled="isRunning" />
                </v-col>
                <v-col cols="12" sm="4">
                    <v-btn color="primary" :loading="isRunning" :disabled="isRunning || otherRunning" @click="startCalibration">
                        <v-icon left>{{ mdiPlay }}</v-icon>
                        {{ $t('Calibration.Pid.Start') }}
                    </v-btn>
                </v-col>
                <v-col v-if="stepState.status === 'success'" cols="12" sm="4">
                    <v-btn color="secondary" :loading="loadings.includes('calibrationSaveConfig')" @click="saveConfig">
                        <v-icon left>{{ mdiContentSave }}</v-icon>
                        {{ $t('Buttons.Save') }}
                    </v-btn>
                </v-col>
            </v-row>

            <v-alert v-if="stepState.status === 'success'" type="success" dense class="mt-3">
                {{
                    $t('Calibration.Pid.Result', {
                        kp: stepState.result.kp,
                        ki: stepState.result.ki,
                        kd: stepState.result.kd,
                    })
                }}
            </v-alert>
            <v-alert v-if="stepState.status === 'error'" type="error" dense class="mt-3">
                {{ stepState.errorMessage }}
            </v-alert>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiThermometer, mdiPlay, mdiContentSave } from '@mdi/js'
import { PidStepState } from '@/store/calibration/types'

const PID_RESULT_REGEX = /pid_Kp=([\d.]+) pid_Ki=([\d.]+) pid_Kd=([\d.]+)/i

interface ConsoleEvent {
    date: Date
    message: string
}

@Component
export default class PidCalibrationPanel extends Mixins(BaseMixin) {
    mdiThermometer = mdiThermometer
    mdiPlay = mdiPlay
    mdiContentSave = mdiContentSave

    @Prop({ type: String, required: true }) readonly heater!: 'extruder' | 'heater_bed'
    @Prop({ type: String, required: true }) readonly title!: string
    @Prop({ type: Boolean, default: false }) readonly otherRunning!: boolean

    get storeKey(): 'pidHotend' | 'pidBed' {
        return this.heater === 'extruder' ? 'pidHotend' : 'pidBed'
    }

    get stepState(): PidStepState {
        return this.storeKey === 'pidHotend'
            ? this.$store.getters['calibration/getPidHotend']
            : this.$store.getters['calibration/getPidBed']
    }

    get isRunning(): boolean {
        return this.stepState.status === 'running'
    }

    get targetTempLocal(): number {
        return this.stepState.targetTemp
    }

    set targetTempLocal(value: number) {
        this.$store.commit('calibration/setPidTargetTemp', { heater: this.storeKey, targetTemp: value })
    }



    get events(): ConsoleEvent[] {
        return this.$store.state.server?.events ?? []
    }

    get startedAt(): number | null {
        return this.stepState.startedAt
    }

    @Watch('events')
    onEventsChanged(newEvents: ConsoleEvent[]): void {
        if (!this.isRunning || this.startedAt === null) return

        const relevantEvents = newEvents.filter((event) => new Date(event.date).getTime() >= this.startedAt!)

        const match = relevantEvents
            .map((event) => PID_RESULT_REGEX.exec(event.message))
            .find((result): result is RegExpExecArray => result !== null)

        if (match) {
            this.$store.commit('calibration/setPidResult', {
                heater: this.storeKey,
                result: { kp: parseFloat(match[1]), ki: parseFloat(match[2]), kd: parseFloat(match[3]) },
            })
            return
        }

        const failure = relevantEvents.find((event) => event.message.startsWith('!!'))
        if (failure) {
            this.$store.commit('calibration/setPidError', { heater: this.storeKey, message: failure.message })
        }
    }

    startCalibration(): void {
        if (this.isRunning) return

        this.$store.commit('calibration/setPidStatus', { heater: this.storeKey, status: 'running', startedAt: Date.now() })

        const gcodes: string[] = []
        if (this.heater === 'extruder') gcodes.push('M106 S255')
        gcodes.push(`PID_CALIBRATE HEATER=${this.heater} TARGET=${this.targetTempLocal}`)
        if (this.heater === 'extruder') gcodes.push('M107')

        gcodes.forEach((gcode) => {
            this.$store.dispatch('server/addEvent', { message: gcode, type: 'command' })
            this.$socket.emit('printer.gcode.script', { script: gcode }, { loading: `pidCalibrate_${this.storeKey}` })
        })
    }

    saveConfig(): void {
        const gcode = 'SAVE_CONFIG'
        this.$store.dispatch('server/addEvent', { message: gcode, type: 'command' })
        this.$socket.emit('printer.gcode.script', { script: gcode }, { loading: 'calibrationSaveConfig' })
    }
}
</script>
