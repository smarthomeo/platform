import React from 'react';
import '../index.scss';
import { CoreMessageType } from '../../../utils';
import { Nullable } from '../../../types';
import { GroupChannel } from '@sendbird/chat/groupChannel';
export interface MessageHeaderProps {
    channel: Nullable<GroupChannel>;
    message: CoreMessageType;
}
export declare const MessageHeader: (props: MessageHeaderProps) => React.JSX.Element;
export default MessageHeader;
