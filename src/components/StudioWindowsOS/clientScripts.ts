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

export const PLAYER_SCRIPT_TAB_LABEL = 'PlayerScript' as const

export const PLAYER_SCRIPT_TAB_PATH = 'Drone Racer (Client)/PlayerScript' as const

export const CLIENT_SCRIPT_EDIT_SOURCE = 'this is the source/edit state of the LocalScript' as const

export const CLIENT_SCRIPT_TEST_COPY_SOURCE = 'this is a client copy of the LocalScript' as const

export const DEFAULT_CLIENT_SCRIPT_DOCUMENT: ClientScriptDocument = {
  tabLabel: PLAYER_SCRIPT_TAB_LABEL,
  tabPath: PLAYER_SCRIPT_TAB_PATH,
  source: CLIENT_SCRIPT_TEST_COPY_SOURCE,
}

export const CAMERA_ZOOM_SCRIPT_DOCUMENT: ClientScriptDocument = {
  tabLabel: CAMERA_ZOOM_SCRIPT_TAB_LABEL,
  tabPath: CAMERA_ZOOM_SCRIPT_TAB_PATH,
  source: CAMERA_ZOOM_SCRIPT_SOURCE,
}

/** Server datamodel script tab (test / edit). */
export const SERVER_SCRIPT_TAB_LABEL = 'AddAtRuntime' as const

export const SERVER_SCRIPT_TAB_PATH = 'Drone Racer (Server)/AddAtRuntime' as const

export const SERVER_SCRIPT_EDIT_SOURCE = 'this is the source/edit state of the Script' as const

export const SERVER_SCRIPT_TEST_COPY_SOURCE = 'this is a Server copy of the Script' as const
