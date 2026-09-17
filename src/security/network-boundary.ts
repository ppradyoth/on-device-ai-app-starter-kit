export interface ObservedRequest {
  url: string
  body?: string
}

export function inspectNetworkBoundary(
  requests: ObservedRequest[],
  markers: string[],
  allowedUrls: string[] = [],
): ObservedRequest[] {
  return requests.filter((request) => {
    const containsMarker = markers.some((marker) =>
      `${request.url}\n${request.body ?? ''}`.includes(marker),
    )
    const isAllowed = allowedUrls.some((allowedUrl) => request.url.startsWith(allowedUrl))
    const currentOrigin = typeof location === 'undefined' ? '' : location.origin
    const isSameOrigin =
      currentOrigin !== '' && new URL(request.url, currentOrigin).origin === currentOrigin
    return containsMarker || (!isAllowed && !isSameOrigin)
  })
}

export function positiveControlDetectsMarker(request: ObservedRequest[], marker: string): boolean {
  return inspectNetworkBoundary(request, [marker]).some((entry) =>
    `${entry.url}\n${entry.body ?? ''}`.includes(marker),
  )
}
