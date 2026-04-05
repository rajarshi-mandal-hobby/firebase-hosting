import { useNavigate, useLocation, useSearchParams, useNavigation } from 'react-router';
import { FormNames } from '../../contexts';

export type Path = '/' | 'member-action' | 'generate-bills' | 'default-rents' | 'member-details';



export type MemberAction = keyof Pick<typeof FormNames, 'add-member' | 'edit-member' | 'reactivate-member'>;

export const useMyNavigation = () => {
    const navigate = useNavigate();
   
    const [searchParams] = useSearchParams();
    const navigation = useNavigation();
    const isNavigating = navigation.state === 'loading';

     const location = useLocation();
     const path = location.pathname === '/' ? '/' : location.pathname.slice(1) as Path;


    // 1. Cleaner path detection

    const memberAction = (searchParams.get('action') ?? 'add-member') as MemberAction;
    const memberId = searchParams.get('id');

    const navigateTo = (
        newPath: Path,
        { memberid, action }: { memberid?: string | null; action?: MemberAction | null } = {}
    ) => {
        // 2. Clone current params to modify them without affecting current state prematurely
        const nextParams = new URLSearchParams(searchParams);

        const params = {
            action: action ?? 'add-member',
            id: memberid ?? null
        };

        const isMemberAction = newPath === 'member-action';
        const isMemberDetails = newPath === 'member-details';

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
                pathname: newPath,
                search: nextParams.toString()
            },
            {
                viewTransition: true,
                replace: location.pathname !== '/'
            }
        );
    };

    const goBack = () => navigate(-1);
    const getMode = (path: Path) => (path === '/' ? 'visible' : 'hidden');

    return { navigateTo, path, goBack, getMode, memberAction, memberId, isNavigating };
};
