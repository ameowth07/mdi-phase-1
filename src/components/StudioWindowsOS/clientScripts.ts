/** Client datamodel script opened from Output error rows. */
export const CAMERA_ZOOM_SCRIPT_TAB_LABEL = 'CameraZoomScript' as const

export const CAMERA_ZOOM_SCRIPT_TAB_PATH = 'Drone Racer (Client)/CameraZoomScript' as const

export const CAMERA_ZOOM_SCRIPT_SOURCE = `UserInputService.InputChanged:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseWheel then
		-- Scroll up = zoom in (negative), scroll down = zoom out (positive)
		local direction = -input.Position.Z
		targetZoom = math.clamp(targetZoom + direction * ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM)
	end
end)`

export type ClientScriptDocument = {
  tabLabel: string
  tabPath: string
  source: string
}

export const DEFAULT_CLIENT_SCRIPT_DOCUMENT: ClientScriptDocument = {
  tabLabel: 'Script',
  tabPath: 'Drone Racer (Client)/Script',
  source: 'this is a Client script',
}

export const CAMERA_ZOOM_SCRIPT_DOCUMENT: ClientScriptDocument = {
  tabLabel: CAMERA_ZOOM_SCRIPT_TAB_LABEL,
  tabPath: CAMERA_ZOOM_SCRIPT_TAB_PATH,
  source: CAMERA_ZOOM_SCRIPT_SOURCE,
}
