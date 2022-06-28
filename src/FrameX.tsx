import React, { ReactNode, createRef } from 'react'
import {
    View,
    SafeAreaView,
    BackHandler,
    ViewStyle,
    StyleSheet,
    GestureResponderEvent,
    Text,
    Animated,
    Easing,
} from 'react-native'

import { PartialRenderManager, PartialRenderView } from './PartialRender';
import { RouteX, RenderCallbackParams, PageInterface } from './RouteX';
enum hideView {
    None = 0,
    Top = 1 << 1,
    Left = 1 << 2,
    Mid = 1 << 3,
    Right = 1 << 4,
    Bottom = 1 << 5
}
interface FramePageInterface extends PageInterface {
    hideViews?: hideView
}
interface FrameRenderCallbackParams extends RenderCallbackParams {
    page: FramePageInterface
}
interface FrameXContent {
    top?: ReactNode,
    left?: ReactNode,
    mid?: ReactNode,
    right?: ReactNode,
    bottom?: ReactNode,
    drawer?: ReactNode,
}
interface FrameXProps extends FrameXContent {
    pages: PageInterface[],
    initialPageName: string,
    style?: ViewStyle
}
interface ModalXProps {
    content: ReactNode,
    style?: ViewStyle,
    onClose?: Function,
    timeout?: number,
    uuid?: string
}
class ModalX extends React.Component<{ c_modal: ModalXProps, index: number, onClose?: Function }> {
    state = { fadeAnim: new Animated.Value(0) };
    componentDidMount() {
        this.fadeIn();
    }
    fadeIn = () => {
        Animated.timing(this.state.fadeAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true, }).start();
    };

    fadeOut = () => {
        Animated.timing(this.state.fadeAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }).start(() => { this.props.onClose && this.props.onClose() });
    };
    render() {
        const { c_modal, index, onClose } = this.props;
        return (
            <Animated.View
                onStartShouldSetResponder={(e) => { this.fadeOut(); return true }}
                key={c_modal.uuid}
                style={[styles.modalMainContainer, { zIndex: (1000 + index), elevation: (1000 + index), opacity: this.state.fadeAnim, transform: [{ scale: this.state.fadeAnim }] }]}>
                <View onStartShouldSetResponder={(e) => true} style={[styles.modalContainer, c_modal.style]}>
                    {c_modal.content}
                </View>
            </Animated.View>
        );
    }
}
class FrameX extends React.Component<FrameXProps, { content: FrameXContent, drawerX: number, hideViews: hideView }> {
    private _viewRefs: { [key: string]: React.RefObject<PartialRenderView> };
    static modalStack: ModalXProps[] = [];
    prevX: number = 0;
    prevY: number = 0;
    constructor(props: FrameXProps) {
        super(props);
        this.state = { content: props, drawerX: 0.2, hideViews: hideView.None };
        this.renderCallback = this.renderCallback.bind(this);
        RouteX.init({ authChecker: () => { return true; }, renderCallback: this.renderCallback, pages: props.pages, initialPageName: this.props.initialPageName });
        this._viewRefs = { top: createRef(), left: createRef(), mid: createRef(), right: createRef(), bottom: createRef(), absolute: createRef() };
        PartialRenderManager.register(this as unknown as PartialRenderView, 'Frame');
    }
    backHandler() {
        return FrameX.modalStack.length > 0 ? FrameX.closeModal() || true : RouteX.goBack();
    }
    componentDidMount() {
        BackHandler.addEventListener("hardwareBackPress", this.backHandler);
    }
    renderCallback(params: FrameRenderCallbackParams) {
        let PageToRender = params.authorized ? params.page.page : params.page.fallbackPage || null;
        if (PageToRender) {
            PageToRender = ((Elem: React.ComponentClass<any>) => <Elem {...params.props} />)(PageToRender as unknown as React.ComponentClass);
            params.page.hideViews && (params.page.hideViews & hideView.Top) ? this._viewRefs.top.current?.clearContent() : this._viewRefs.top.current?.resetContent(true);
            params.page.hideViews && (params.page.hideViews & hideView.Left) ? this._viewRefs.left.current?.clearContent() : this._viewRefs.left.current?.resetContent(true);
            params.page.hideViews && (params.page.hideViews & hideView.Mid) ? this._viewRefs.mid.current?.clearContent() : this._viewRefs.mid.current?.resetContent(true);
            params.page.hideViews && (params.page.hideViews & hideView.Right) ? this._viewRefs.rigt.current?.clearContent() : this._viewRefs.right.current?.resetContent(true);
            params.page.hideViews && (params.page.hideViews & hideView.Bottom) ? this._viewRefs.bottom.current?.clearContent() : this._viewRefs.bottom.current?.resetContent(true);
            PartialRenderManager.find('Mid').updateContent(PageToRender);
        }
        else
            __DEV__ && console.log("FrameX :: renderCallback Invalid Parameter");
        return true;
    }
    static renderModals() {
        const contentToRender = FrameX.modalStack.map((c_modal, index) => {
            return c_modal.content && <ModalX key={`m_${index}`} c_modal={c_modal} index={index} onClose={this.closeModal} />
        })
        PartialRenderManager.find('Absolute').updateContent(contentToRender);
        PartialRenderManager.find('Frame').forceUpdate();
    }
    static showModal(modal: ModalXProps) {
        const date = new Date();
        modal.uuid = date.getTime().toString() + date.getMilliseconds() + Math.random().toString();
        FrameX.modalStack.push(modal);
        modal.timeout && setTimeout(() => { FrameX.closeModal(modal.uuid); }, modal.timeout);
        FrameX.renderModals();
    }
    static closeModal(modalUuid?: string) {
        const modalIndex = modalUuid ? FrameX.modalStack.findIndex(modal => modal.uuid == modalUuid) : -1;
        const modalToClose = modalIndex != -1 ? FrameX.modalStack.splice(modalIndex, 1)[0] : FrameX.modalStack.pop() as ModalXProps;
        ((modalUuid && modalIndex != -1) || !modalUuid) && FrameX.renderModals();
        modalToClose && modalToClose.onClose && modalToClose.onClose(modalToClose);
        return true;
    }
    gestureHandler(evt: GestureResponderEvent, type: "start" | "end" | "move") {
        if (!this.props.drawer)
            return
        if (type == "start") {
            this.prevX = evt.nativeEvent.locationX;
            this.prevY = evt.nativeEvent.locationY
        }
        const relX = evt.nativeEvent.locationX - this.prevX;
        const relY = evt.nativeEvent.locationY - this.prevY;
        if (type == "end") {
            this.setState({ drawerX: relX > 100 ? styles.drawerStyle.width : 0 });
        }
        else
            this.setState({ drawerX: relX < styles.drawerStyle.width ? relX : styles.drawerStyle.width });
    }
    render(): React.ReactNode {
        const { top, left, mid, right, bottom, drawer } = this.props;
        return (
            <View onStartShouldSetResponder={(evt) => { this.gestureHandler(evt, "start"); return true; }}
                onResponderMove={evt => this.gestureHandler(evt, "move")}
                onResponderRelease={evt => this.gestureHandler(evt, "end")}>
                <PartialRenderView ref={this._viewRefs.absolute} name={'Absolute'} content={null} />
                <View onStartShouldSetResponder={(e) => true} style={[styles.drawerStyle, { transform: [{ translateX: -1 * styles.drawerStyle.width + this.state.drawerX }] }]}>
                    <PartialRenderView ref={this._viewRefs.drawer} name={'Drawer'} content={drawer} />
                </View>
                <SafeAreaView
                    pointerEvents={FrameX.modalStack.length > 0 || this.state.drawerX == styles.drawerStyle.width ? 'none' : 'auto'} style={[styles.frameContainer, this.props.style]}>
                    <PartialRenderView ref={this._viewRefs.top} name={'Top'} content={top} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', flex: 1 }}>
                        <PartialRenderView ref={this._viewRefs.left} name={'Left'} content={left} />
                        <PartialRenderView ref={this._viewRefs.mid} name={'Mid'} content={mid} />
                        <PartialRenderView ref={this._viewRefs.right} name={'Right'} content={right} />
                    </View>
                    <PartialRenderView ref={this._viewRefs.bottom} name={'Bottom'} content={bottom} />
                </SafeAreaView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    drawerStyle:
    {
        position: 'absolute',
        width: 200,
        height: "100%",
        backgroundColor: "white",
        borderRightColor: "lightgrey",
        borderRightWidth: 2,
        elevation: 1,
        zIndex: 1
    },
    frameContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
    },
    modalMainContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalContainer: {
        width: '90%',
        height: 'auto',
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: 'lightgrey',
        borderRadius: 10,
        padding: 10
    }
})
const showModal = FrameX.showModal;
export type { FrameXContent, FramePageInterface }
export { showModal, hideView, FrameX };
export default FrameX;