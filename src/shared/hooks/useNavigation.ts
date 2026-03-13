import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { FormNames } from '../../contexts';

export const Views = {
    home: 'Home',
    'member-action': 'Add Member',
    'generate-bills': 'Generate Bills',
    'default-rents': 'Default Rents',
    'member-details': 'Member Details'
} as const;

export type View = keyof typeof Views;

export type MemberAction = keyof Pick<typeof FormNames, 'add-member' | 'edit-member' | 'reactivate-member'>;

export const useMyNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // 1. Cleaner path detection
    const view = (location.pathname === '/' ? 'home' : location.pathname.substring(1)) as View;
    const memberAction = (searchParams.get('action') || 'add-member') as MemberAction;
    const memberId = searchParams.get('id');

    const navigateTo = (
        newView: View,
        { memberid, action }: { memberid?: string | null; action?: MemberAction | null } = {}
    ) => {
        const path = newView === 'home' ? '/' : `/${newView}`;

        console.log('memberid', memberid);

        // 2. Clone current params to modify them without affecting current state prematurely
        const nextParams = new URLSearchParams(searchParams);

        const params = {
            action: action ?? 'add-member',
            id: memberid ?? null
        };

        const isMemberAction = newView === 'member-action';
        const isMemberDetails = newView === 'member-details';

        if (isMemberAction || isMemberDetails) {
            if (isMemberAction) nextParams.set('action', params.action);
            if (params.id) {
                nextParams.set('id', params.id);
            } else {
                nextParams.delete('id');
            }
        } else {
            // Optional: Clear member params when leaving 'add-member'
            nextParams.delete('id');
            nextParams.delete('action');
        }

        navigate(
            {
                pathname: path,
                search: nextParams.toString()
            },
            {
                viewTransition: true,
                replace: view !== 'home'
            }
        );
    };

    const goBack = () => navigate(-1);
    const getMode = (path: View) => (view === path ? 'visible' : 'hidden');

    return { navigateTo, goBack, getMode, view, memberAction, memberId };
};
