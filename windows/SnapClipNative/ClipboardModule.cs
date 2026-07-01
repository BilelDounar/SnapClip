using Microsoft.ReactNative;
using Microsoft.ReactNative.Managed;
using System;
using System.Runtime.InteropServices;
using System.Threading;
using Windows.ApplicationModel.DataTransfer;

namespace SnapClipNative
{
    [ReactModule]
    internal sealed class ClipboardModule
    {
        [ReactMethod("setText")]
        public void SetText(string text)
        {
            var dataPackage = new DataPackage();
            dataPackage.SetText(text);
            Clipboard.SetContent(dataPackage);
        }

        [ReactMethod("pasteAtCursor")]
        public void PasteAtCursor()
        {
            // Simulate Ctrl+V
            SendKeyWithModifier(VK_CONTROL, VK_V);
        }

        private static void SendKeyWithModifier(ushort modifier, ushort key)
        {
            var inputs = new INPUT[4];

            // Press modifier
            inputs[0] = CreateKeyboardInput(modifier, 0);
            // Press key
            inputs[1] = CreateKeyboardInput(key, 0);
            // Release key
            inputs[2] = CreateKeyboardInput(key, KEYEVENTF_KEYUP);
            // Release modifier
            inputs[3] = CreateKeyboardInput(modifier, KEYEVENTF_KEYUP);

            SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));
        }

        private static INPUT CreateKeyboardInput(ushort key, uint flags)
        {
            return new INPUT
            {
                type = INPUT_KEYBOARD,
                u = new INPUTUNION
                {
                    ki = new KEYBDINPUT
                    {
                        wVk = key,
                        dwFlags = flags,
                        time = 0,
                        dwExtraInfo = IntPtr.Zero
                    }
                }
            };
        }

        private const int INPUT_KEYBOARD = 1;
        private const uint KEYEVENTF_KEYUP = 0x0002;
        private const ushort VK_CONTROL = 0x11;
        private const ushort VK_V = 0x56;

        [StructLayout(LayoutKind.Sequential)]
        private struct INPUT
        {
            public int type;
            public INPUTUNION u;
        }

        [StructLayout(LayoutKind.Explicit)]
        private struct INPUTUNION
        {
            [FieldOffset(0)]
            public KEYBDINPUT ki;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [DllImport("user32.dll")]
        private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
    }
}
