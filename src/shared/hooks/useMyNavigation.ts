import { useNavigate, useLocation, useSearchParams, useNavigation } from 'react-router';
import { MEMBER_ACTION_QUERY_ID, type MemberFormAction, type Pathname } from '../../data/types';

interface NavigateToParams {
    memberId?: string;
    action?: MemberFormAction | null;
}

export const useMyNavigation = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const navigation = useNavigation();
    const isNavigating = navigation.state === 'loading';

    const location = useLocation();
    const pathname = (location.pathname.replace('/', '') as Pathname) || '/';

    const paramMemberAction = searchParams.get('member-action' as Pathname) as MemberFormAction | null;
    const paramMemberId = searchParams.get(MEMBER_ACTION_QUERY_ID);

    const isHome = pathname === '/';

    const navigateTo = (newPath: Pathname, { memberId, action }: NavigateToParams = {}) => {
        const nextParams = new URLSearchParams(searchParams);

        const navigateFn = (pathname: Pathname, search = '') =>
            navigate(
                {
                    pathname,
                    search
                },
                {
                    viewTransition: true,
                    // replace: pathname !== '/'
                }
            );

        switch (true) {
            case memberId && newPath === 'member-details': {
                nextParams.set('id', memberId);
                navigateFn('member-details', nextParams.toString());
                break;
            }
            case newPath === 'member-action' && memberId && action && action !== 'add': {
                nextParams.set('action', action);
                if (memberId) {
                    nextParams.set('id', memberId);
                }
                navigateFn('member-action', nextParams.toString());
                break;
            }
            case memberId && action && action !== 'add' && newPath === 'member-action': {
                nextParams.set('action', action);
                nextParams.set('id', memberId);
                navigateFn('member-action', nextParams.toString());
                break;
            }
            default:
                throw new Error('The link seems to be broken');
        }
    };

    const goBack = async () => {
        // Check if we are at the root path using location.key because location.key will be 'default' when at the root path

        await navigate(-1);
    };

    return {
        location,
        pathname,
        isHome,
        paramMemberAction,
        paramMemberId,
        navigate,
        isNavigating,
        loacationKey: location.key,
        actions: {
            navigateTo,
            goBack
        }
    };
};
