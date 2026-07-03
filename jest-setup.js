/* global jest */
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class MockNativeEventEmitter {
    addListener = jest.fn(() => ({remove: jest.fn()}));
    removeAllListeners = jest.fn();
  };
});
