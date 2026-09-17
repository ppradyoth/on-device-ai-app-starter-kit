import { expect, test } from '@playwright/test'
import { inspectNetworkBoundary } from '../../src/security/network-boundary'

test('indexes, cites, deletes, and reloads in offline local mode', async ({
  page,
  context,
  baseURL,
}) => {
  const requests: Array<{ url: string; body?: string }> = []
  await page.on('request', (request) => {
    requests.push({ url: request.url(), body: request.postData() ?? undefined })
  })

  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Ask your documents questions inside the browser.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Download model/ }).click()
  await expect(page.getByRole('button', { name: /Model ready/ })).toBeVisible()

  const documentMarker = 'E2E-DOCUMENT-MARKER-7c1d'
  await page.locator('input[type="file"]').setInputFiles({
    name: 'local-marker.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(`The local policy marker is ${documentMarker}.`),
  })
  await expect(page.getByText(/local-marker\.txt/)).toBeVisible()
  await page.getByRole('textbox', { name: 'Question' }).fill('What does the local policy contain?')
  await page.getByRole('button', { name: 'Generate locally' }).click()
  await expect(page.getByText(/Local answer citing/)).toBeVisible()
  await expect(page.getByText(/Sources \(1\)/)).toBeVisible()
  await expect(page.getByText(documentMarker)).toBeVisible()

  const positiveMarker = 'E2E-POSITIVE-CONTROL-9a42'
  let positiveControlBody = ''
  await page.route('**/__positive-control', async (route) => {
    positiveControlBody = route.request().postData() ?? ''
    await route.fulfill({ status: 204, body: '' })
  })
  await page.evaluate(async (marker) => {
    await fetch('/__positive-control', { method: 'POST', body: marker })
  }, positiveMarker)
  expect(positiveControlBody).toContain(positiveMarker)

  const appRequests = requests.filter((request) => !request.url.includes('__positive-control'))
  expect(inspectNetworkBoundary(appRequests, [documentMarker], [baseURL ?? ''])).toEqual([])

  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('No indexed documents yet.')).toBeVisible()

  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) await navigator.serviceWorker.ready
  })
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Ask your documents questions inside the browser.' }),
  ).toBeVisible()
})
