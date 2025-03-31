import React from 'react';
import type { GroupChannel } from '@sendbird/chat/groupChannel';
import type { RenderUserProfileProps } from '../types';
interface UserProfileContextInterface {
    isOpenChannel: boolean;
    disableUserProfile: boolean;
    renderUserProfile?: (props: RenderUserProfileProps) => React.ReactElement;
    onStartDirectMessage?: (channel: GroupChannel) => void;
    /**
     * @deprecated This prop has been renamed to `onStartDirectMessage`.
     */
    onUserProfileMessage?: (channel: GroupChannel) => void;
}
/**
 * user profile goes deep inside the component tree
 * use this context as a short circuit to send in values
 */
export declare const UserProfileContext: React.Context<UserProfileContextInterface>;
export type UserProfileProviderProps = React.PropsWithChildren<Partial<UserProfileContextInterface> & {
    /** This prop is optional. It is no longer necessary to provide it because the value can be accessed through SendbirdStateContext. */
    disableUserProfile?: boolean;
    /** This prop is optional. It is no longer necessary to provide it because the value can be accessed through SendbirdStateContext. */
    renderUserProfile?: (props: RenderUserProfileProps) => React.ReactElement;
}>;
export declare const useUserProfileContext: () => UserProfileContextInterface;
export declare const UserProfileProvider: ({ isOpenChannel, disableUserProfile: _disableUserProfile, renderUserProfile: _renderUserProfile, onUserProfileMessage: _onUserProfileMessage, onStartDirectMessage: _onStartDirectMessage, children, }: UserProfileProviderProps) => React.JSX.Element;
export {};
