import React, { ReactNode } from "react";
//import { sha1 } from 'react-native-sha1';
import {swx} from './HashX'

enum loginType {
    Default,
    LoggedIn,
    NotLogged,
    EveryOne,
}
interface PageInterface {
    regex: RegExp,
    regexMap?: string[],
    title?: string,
    page: ReactNode,
    loginType: loginType
    fallbackPage?: ReactNode
}
interface RenderCallbackParams {
    page: PageInterface,
    props: {},
    authorized: boolean
}
interface RouteInitProps {
    authChecker: () => boolean,
    renderCallback: (param: RenderCallbackParams) => boolean,
    pages: PageInterface[],
    initialPageName: string
}
class RouteX {
    static instance: any;
    pageStack: { hash: string, title: string, page: string, props: {} }[] = [];
    authChecker: () => boolean = () => true;
    pages: PageInterface[] = [];
    renderCallback: (param: RenderCallbackParams) => boolean = () => true;
    async generatePageHash(name: string, props: {}) {
        return swx(name + JSON.stringify(props));
    }
    async goto(pageName: string, props: {} = {}) {
        const hash = await this.generatePageHash(pageName, props);
        let routeMatch: any = null;
        this.pages.every(page => {
            routeMatch = pageName.match(page.regex);
            if (routeMatch) {
                const pageIndex = this.pageStack.findIndex(page => page.hash == hash);
                pageIndex != -1 && this.pageStack.splice(pageIndex, 1);

                let additionalProps: { [key: string]: any } = {};
                if (page.regexMap) {
                    if (page.regexMap.length == routeMatch.length) {
                        page.regexMap.forEach((key, i) => {
                            additionalProps[key] = routeMatch[i];
                        })
                    }
                    else
                        __DEV__ && console.log('RouteX :: Regex Mapping Failure : ' + pageName);
                }
                this.pageStack.push({ hash, title: (page.title ? page.title : pageName), page: pageName, props: { ...props, ...additionalProps } });
                const renderResult = this.renderCallback({
                    page,
                    props: { ...props, ...additionalProps },
                    authorized: !!(~~this.authChecker() & page.loginType)
                })
                if (!renderResult) {
                    this.pageStack.pop();
                }
            }
            return !routeMatch; // every continues on true
        });

        !routeMatch && __DEV__ && console.log('RouteX :: Page Not Found : ' + pageName);
    }
    goBack() {
        if (this.pageStack.length > 1) {
            this.pageStack.pop();
            const prevPage = this.pageStack[this.pageStack.length - 1];
            prevPage && this.goto(prevPage.page);
            return true;
        }
        else
            return false;
    }
    init(params: RouteInitProps) {
        this.renderCallback = params.renderCallback;
        this.authChecker = params.authChecker;
        this.pages = params.pages;
        this.goto(params.initialPageName)

    }
    static getInstance(): RouteX {
        if (!this.instance)
            this.instance = new RouteX();
        return this.instance;
    }
}

const inst = RouteX.getInstance();
export type { PageInterface, RenderCallbackParams }
export { inst as RouteX, loginType };