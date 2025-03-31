import { BaseMessage, MessageForm } from '@sendbird/chat/message';
import React from 'react';
import './index.scss';
import { LoggerInterface } from '../../lib/Logger';
interface Props {
    message: BaseMessage;
    form: MessageForm;
    isByMe: boolean;
    logger?: LoggerInterface;
}
export default function FormMessageItemBody(props: Props): React.JSX.Element;
export {};
