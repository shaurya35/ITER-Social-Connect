import { useRouter } from 'next/navigation';

export function useProfileNavigation() {
  const router = useRouter();

  const redirectToProfile = (profileId) => {
    router.push(`/profile/${profileId}`);
  };

  return redirectToProfile;
}

// import { useProfileNavigation } from '@/contexts/ProfileNavigation';

// function UserCard({ user }) {
//   const redirectToProfile = useProfileNavigation();
  
//   return (
//     <div onClick={() => redirectToProfile(user.id)}>
//       {/* ... */}
//     </div>
//   );
// }