import React, { ReactNode } from "react";
class PartialRenderManager {
    static _instance: PartialRenderManager | null = null;
    nodeList: { [key: string]: PartialRenderView } = {};
    register(node: PartialRenderView, name?: string) {
        const nodeName = name ? name : node.props.name;
        __DEV__ && this.nodeList[nodeName] && console.log('PartialRenderManager :: Node Overwrite :' + nodeName);
        this.nodeList[nodeName] = node;
    }
    list() {
        return this.nodeList;
    }
    find(name: string) {
        return this.nodeList[name] || null;
    }
    static getInstance(): PartialRenderManager {
        !this._instance && (this._instance = new PartialRenderManager());
        return this._instance;
    }
}
class PartialRenderView extends React.Component<{ name: string, content?: ReactNode, args?: {} }, { content: ReactNode, args?: {} }> {
    renderManager: PartialRenderManager;
    constructor(props: any) {
        super(props);
        this.state = { content: this.props.content || null, args: this.props.args };
        this.updateContent = this.updateContent.bind(this);
        this.resetContent = this.resetContent.bind(this);
        this.clearContent = this.clearContent.bind(this);
        this.renderManager = PartialRenderManager.getInstance();
        this.renderManager.register(this);
    }
    updateContent(content?: ReactNode, args?: {}) {
        content && this.setState({ content });
        args && this.setState({ args });
    }
    resetContent(ifEmpty: boolean) {
        (!ifEmpty || (ifEmpty && this.state.content == null)) && this.setState({ content: this.props.content, args: this.props.args });
    }
    clearContent() {
        this.setState({ content: null });
    }
    render() {
        const { content: Content, args } = this.state;
        return Content ? Content : null;
    }
}





const manager = PartialRenderManager.getInstance();
export { PartialRenderView, manager as PartialRenderManager }