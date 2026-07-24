import axios from 'axios'
import { sha256 } from 'js-sha256'

export function replaceExtruderRotationDistance(fileText: string, newValue: number): string {
    const lines = fileText.split('\n')

    const sectionStart = lines.findIndex((line) => line.trim() === '[extruder]')
    if (sectionStart === -1) {
        throw new Error('Could not find [extruder] section in printer.cfg')
    }

    let sectionEnd = lines.length
    for (let i = sectionStart + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith('[')) {
            sectionEnd = i
            break
        }
    }

    let replaced = false
    for (let i = sectionStart; i < sectionEnd; i++) {
        const match = /^(\s*rotation_distance:\s*)([\d.]+)(.*)$/.exec(lines[i])
        if (match) {
            lines[i] = `${match[1]}${newValue.toFixed(3)}${match[3]}`
            replaced = true
            break
        }
    }

    if (!replaced) {
        throw new Error('Could not find rotation_distance line inside [extruder] section')
    }

    return lines.join('\n')
}

export async function fetchPrinterConfig(apiUrl: string): Promise<string> {
    const response = await axios.get(`${apiUrl}/server/files/config/printer.cfg?${Date.now()}`, {
        responseType: 'blob',
    })
    return await response.data.text()
}

export async function savePrinterConfig(apiUrl: string, content: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/plain' })
    const formData = new FormData()
    formData.append('file', blob, 'printer.cfg')
    formData.append('root', 'config')
    formData.append('checksum', sha256(content))

    await axios.post(`${apiUrl}/server/files/upload`, formData)
}
