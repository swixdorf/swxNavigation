import React, { ReactNode, createRef } from 'react'
import {
    View,
    SafeAreaView,
    BackHandler,
    ViewStyle,
    StyleSheet,
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
    bottom?: ReactNode
}
interface FrameXProps extends FrameXContent {
    pages: PageInterface[],
    initialPageName:string,
    style?: ViewStyle
}
interface ModalProps {
    content: ReactNode,
    style?: ViewStyle,
    onClose?: Function,
    timeout?: number,
    uuid?: string
}
class FrameX extends React.Component<FrameXProps, { content: FrameXContent, hideViews: hideView }> {
    private _viewRefs: { [key: string]: React.RefObject<PartialRenderView> };
    static modalStack: ModalProps[] = [];
    constructor(props: FrameXProps) {
        super(props);
        this.state = { content: props, hideViews: hideView.None };
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
    static renderModal() {
        const contentToRender = FrameX.modalStack.map((c_modal, index) => {
            return c_modal.content &&
                <SafeAreaView onStartShouldSetResponder={(e) => { this.closeModal(); return true }} key={c_modal.uuid} style={[styles.modalMainContainer, { zIndex: (1000 + index), elevation: (1000 + index) }]}>
                    <View onStartShouldSetResponder={(e) => true} style={[styles.modalContainer, c_modal.style]}>
                        {c_modal.content}
                    </View>
                </SafeAreaView>
        })
        PartialRenderManager.find('Absolute').updateContent(contentToRender);
        PartialRenderManager.find('Frame').forceUpdate();
    }
    static showModal(modal: ModalProps) {
        const date = new Date();
        modal.uuid = date.getTime().toString() + date.getMilliseconds() + Math.random().toString();
        FrameX.modalStack.push(modal);
        modal.timeout && setTimeout(() => { FrameX.closeModal(modal.uuid); }, modal.timeout);
        FrameX.renderModal();
    }
    static closeModal(modalUuid?: string) {
        const modalIndex = modalUuid ? FrameX.modalStack.findIndex(modal => modal.uuid == modalUuid) : -1;
        const modalToClose = modalIndex != -1 ? FrameX.modalStack.splice(modalIndex, 1)[0] : FrameX.modalStack.pop() as ModalProps;
        ((modalUuid && modalIndex != -1) || !modalUuid) && FrameX.renderModal();
        modalToClose && modalToClose.onClose && modalToClose.onClose(modalToClose);
        return true;
    }
    render(): React.ReactNode {
        const { top, left, mid, right, bottom } = this.props;
        return (
            <>
                <PartialRenderView ref={this._viewRefs.absolute} name={'Absolute'} content={null} />
                <SafeAreaView pointerEvents={FrameX.modalStack.length > 0 ? 'none' : 'auto'} style={[styles.frameContainer, this.props.style]}>
                    <PartialRenderView ref={this._viewRefs.top} name={'Top'} content={top} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', flex: 1 }}>
                        <PartialRenderView ref={this._viewRefs.left} name={'Left'} content={left} />
                        <PartialRenderView ref={this._viewRefs.mid} name={'Mid'} content={mid} />
                        <PartialRenderView ref={this._viewRefs.right} name={'Right'} content={right} />
                    </View>
                    <PartialRenderView ref={this._viewRefs.bottom} name={'Bottom'} content={bottom} />
                </SafeAreaView>
            </>
        );
    }
}

const styles = StyleSheet.create({
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
export { showModal, hideView,FrameX };
export default FrameX;