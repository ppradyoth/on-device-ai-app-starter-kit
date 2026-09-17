import { expect, test } from '@playwright/test'
import {
  inspectNetworkBoundary,
  positiveControlDetectsMarker,
} from '../../src/security/network-boundary'

test('records no post-setup document or inference traffic and catches a positive control', async ({
  page,
  baseURL,
}) => {
  const requests: Array<{ url: string; body?: string }> = []
  page.on('request', (request) => {
    requests.push({ url: request.url(), body: request.postData() ?? undefined })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /Download model/ }).click()
  await expect(page.getByRole('button', { name: /Model ready/ })).toBeVisible()
  const marker = 'NETWORK-DOCUMENT-MARKER-4f88'
  await page.locator('input[type="file"]').setInputFiles({
    name: 'network-marker.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(marker),
  })
  await expect(page.getByText(/network-marker\.txt/)).toBeVisible()
  await page.getByRole('textbox', { name: 'Question' }).fill('What is in the document?')
  await page.getByRole('button', { name: 'Generate locally' }).click()
  await expect(page.getByText(/Local answer citing/)).toBeVisible()

  const appRequests = requests.slice()
  expect(inspectNetworkBoundary(appRequests, [marker], [baseURL ?? ''])).toEqual([])

  const positiveMarker = 'NETWORK-POSITIVE-CONTROL-53d2'
  const positiveRequest = { url: `${baseURL}/__positive-control`, body: positiveMarker }
  expect(positiveControlDetectsMarker([positiveRequest], positiveMarker)).toBe(true)
})
