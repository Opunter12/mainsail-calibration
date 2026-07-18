<template>
    <div>
        <h1>{{ $t('Calibration.Title') }}</h1>
    </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'

@Component
export default class PageCalibration extends Mixins(BaseMixin) {}
</script>
