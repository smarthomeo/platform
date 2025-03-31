import './index.scss';
import { ReactElement } from 'react';
import type { BaseMessage } from '@sendbird/chat/message';
import { MessageTemplateItem } from './types';
import { SendbirdTheme } from '../../types';
export interface RenderData {
    filledMessageTemplateItemsList: {
        version: number;
        items: MessageTemplateItem[];
    }[];
    isErrored: boolean;
}
interface TemplateMessageItemBodyProps {
    className?: string;
    message: BaseMessage;
    isByMe?: boolean;
    theme?: SendbirdTheme;
}
export declare const replaceVariablesInTemplateString: ({ template, templateData, colorVariables, theme, }: {
    template: string;
    templateData?: Record<string, any>;
    colorVariables?: Record<string, string>;
    theme?: SendbirdTheme;
}) => string;
export declare function TemplateMessageItemBody({ className, message, isByMe, theme, }: TemplateMessageItemBodyProps): ReactElement;
export default TemplateMessageItemBody;
