using Microsoft.ReactNative;
using Microsoft.ReactNative.Managed;
using System;
using System.Runtime.InteropServices;
using System.Threading;

namespace SnapClipNative
{
    [ReactModule]
    internal sealed class InputHookModule
    {
        [ReactEvent]
        public Action<string>? OnMouseEvent { get; set; }

        private static IntPtr _hookId = IntPtr.Zero;
        private static LowLevelMouseProc? _proc;
        private static DateTime _firstRightClick = DateTime.MinValue;
        private static DateTime _rightButtonDownTime = DateTime.MinValue;
        private const int DOUBLE_CLICK_INTERVAL_MS = 500;
        private const int LONG_CLICK_THRESHOLD_MS = 600;

        [ReactMethod("startHook")]
        public void StartHook()
        {
            if (_hookId != IntPtr.Zero)
            {
                return;
            }

            _proc = HookCallback;
            _hookId = SetHook(_proc);
        }

        [ReactMethod("stopHook")]
        public void StopHook()
        {
            if (_hookId != IntPtr.Zero)
            {
                UnhookWindowsHookEx(_hookId);
                _hookId = IntPtr.Zero;
                _proc = null;
            }
        }

        private IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0)
            {
                var mouseHookStruct = Marshal.PtrToStructure<MSLLHOOKSTRUCT>(lParam);
                var now = DateTime.Now;

                if (wParam == (IntPtr)WM_RBUTTONDOWN)
                {
                    _rightButtonDownTime = now;
                    var elapsed = now - _firstRightClick;
                    if (elapsed.TotalMilliseconds <= DOUBLE_CLICK_INTERVAL_MS)
                    {
                        OnMouseEvent?.Invoke("double-right-click");
                        _firstRightClick = DateTime.MinValue;
                    }
                    else
                    {
                        _firstRightClick = now;
                    }
                }
                else if (wParam == (IntPtr)WM_RBUTTONUP)
                {
                    var duration = (now - _rightButtonDownTime).TotalMilliseconds;
                    if (duration >= LONG_CLICK_THRESHOLD_MS)
                    {
                        OnMouseEvent?.Invoke("long-right-click");
                    }
                }
            }

            return CallNextHookEx(_hookId, nCode, wParam, lParam);
        }

        private static IntPtr SetHook(LowLevelMouseProc proc)
        {
            using (var curProcess = System.Diagnostics.Process.GetCurrentProcess())
            using (var curModule = curProcess.MainModule)
            {
                if (curModule == null)
                {
                    return IntPtr.Zero;
                }

                var moduleHandle = GetModuleHandle(curModule.ModuleName);
                return SetWindowsHookEx(WH_MOUSE_LL, proc, moduleHandle, 0);
            }
        }

        private delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);

        private const int WH_MOUSE_LL = 14;
        private const int WM_RBUTTONDOWN = 0x0204;
        private const int WM_RBUTTONUP = 0x0205;

        [StructLayout(LayoutKind.Sequential)]
        private struct MSLLHOOKSTRUCT
        {
            public int X;
            public int Y;
            public uint MouseData;
            public uint Flags;
            public uint Time;
            public IntPtr ExtraInfo;
        }

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);
    }
}
