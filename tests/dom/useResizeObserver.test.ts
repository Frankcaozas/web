import { renderHook } from '@testing-library/react-hooks/dom';
import { useResizeObserver } from '../../src';
import Mock = jest.Mock;

describe('useResizeObserver', () => {
  const observeSpy = jest.fn();
  const unobserveSpy = jest.fn();
  const disconnectSpy = jest.fn();

  let ResizeObserverSpy: Mock<ResizeObserver>;
  const initialRO = global.ResizeObserver;

  beforeAll(() => {
    ResizeObserverSpy = jest.fn(() => ({
      observe: observeSpy,
      unobserve: unobserveSpy,
      disconnect: disconnectSpy,
    }));

    global.ResizeObserver = ResizeObserverSpy;
  });

  beforeEach(() => {
    observeSpy.mockClear();
    unobserveSpy.mockClear();
    disconnectSpy.mockClear();
  });

  afterAll(() => {
    global.ResizeObserver = initialRO;
  });

  it('should be defined', () => {
    expect(useResizeObserver).toBeDefined();
  });

  it('should render', () => {
    const { result } = renderHook(() => useResizeObserver(null, () => {}));

    expect(result.error).toBeUndefined();
  });

  it('should create ResizeObserver instance only on first hook render', () => {
    expect(ResizeObserverSpy).toHaveBeenCalledTimes(1);

    renderHook(() => useResizeObserver(null, () => {}));
    renderHook(() => useResizeObserver(null, () => {}));

    expect(ResizeObserverSpy).toHaveBeenCalledTimes(1);
  });

  it('should invoke each callback listening same element', () => {
    const div = document.createElement('div');
    const spy1 = jest.fn();
    const spy2 = jest.fn();

    renderHook(() => useResizeObserver(div, spy1));
    renderHook(() => useResizeObserver(div, spy2));

    expect(observeSpy).toHaveBeenCalledTimes(1);

    const entry = {
      target: div,
      contentRect: {},
      borderBoxSize: {},
      contentBoxSize: {},
    } as unknown as ResizeObserverEntry;

    ResizeObserverSpy.mock.calls[0][0]([entry]);

    expect(spy1).toHaveBeenCalledWith(entry);
    expect(spy2).toHaveBeenCalledWith(entry);
  });

  it('should invoke each callback listening different element', () => {
    const div = document.createElement('div');
    const div2 = document.createElement('div');
    const spy1 = jest.fn();
    const spy2 = jest.fn();

    renderHook(() => useResizeObserver(div, spy1));
    renderHook(() => useResizeObserver({ current: div2 }, spy2));

    expect(observeSpy).toHaveBeenCalledTimes(2);

    const entry1 = {
      target: div,
      contentRect: {},
      borderBoxSize: {},
      contentBoxSize: {},
    } as unknown as ResizeObserverEntry;
    const entry2 = {
      target: div2,
      contentRect: {},
      borderBoxSize: {},
      contentBoxSize: {},
    } as unknown as ResizeObserverEntry;

    ResizeObserverSpy.mock.calls[0][0]([entry1, entry2]);

    expect(spy1).toHaveBeenCalledWith(entry1);
    expect(spy2).toHaveBeenCalledWith(entry2);
  });

  it('should unsubscribe on component unmount', () => {
    const div = document.createElement('div');
    const spy = jest.fn();
    const { unmount } = renderHook(() => useResizeObserver(div, spy));

    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(observeSpy).toHaveBeenCalledWith(div);
    expect(unobserveSpy).toHaveBeenCalledTimes(0);

    unmount();

    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(unobserveSpy).toHaveBeenCalledTimes(1);
    expect(unobserveSpy).toHaveBeenCalledWith(div);
  });
});
