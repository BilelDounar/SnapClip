using Microsoft.ReactNative;
using Microsoft.ReactNative.Managed;
using System;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace SnapClipNative
{
    [ReactModule]
    public sealed class OverlayWindowModule
    {
        [ReactMethod("getWindowBounds")]
        public void GetWindowBounds(int hwndInt, IReactPromise<string> promise)
        {
            try
            {
                var hwnd = new IntPtr(hwndInt);
                if (!GetWindowRect(hwnd, out var rect))
                {
                    throw new InvalidOperationException("Failed to get window bounds.");
                }

                var result = JsonSerializer.Serialize(new
                {
                    x = rect.Left,
                    y = rect.Top,
                    width = rect.Right - rect.Left,
                    height = rect.Bottom - rect.Top
                });

                promise.Resolve(result);
            }
            catch (Exception ex)
            {
                promise.Reject(new ReactError { Exception = ex });
            }
        }

        [ReactMethod("getForegroundWindow")]
        public void GetForegroundWindowHandle(IReactPromise<int> promise)
        {
            try
            {
                promise.Resolve((int)GetForegroundWindow().ToInt64());
            }
            catch (Exception ex)
            {
                promise.Reject(new ReactError { Exception = ex });
            }
        }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [StructLayout(LayoutKind.Sequential)]
        private struct RECT
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }
    }
}
