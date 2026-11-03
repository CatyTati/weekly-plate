import React, { useEffect, useState } from 'react';
import { isDemo } from '../auth';
import { listPeople } from '../social';
import { PersonRow, useFollowing } from './People';
import { useStore } from '../store';
import { Field, Header, Screen, T } from '../components/ui';

export default function Community() {
  const { user, t } = useStore();
  const me = user?.id;
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState(null);
  const { error, setError, busy, statusOf, toggle } = useFollowing(me);
  useEffect(() => {
    const timer = setTimeout(() => listPeople(me, query).then(setPeople).catch(() => setError(true)), 300);
    return () => clearTimeout(timer);
  }, [me, query, setError]);
  const q = query.trim();
  return (
    <Screen>
      <Header title={t('tab_community')} />
      <Field placeholder={t('searchPeople')} value={query} autoCapitalize="none" autoCorrect={false} returnKeyType="search" onChangeText={setQuery} />

      {isDemo ? null : <>
        <T v="heading">{t('appPeople')}</T>
        {error ? <T c="error">{t('eNetwork')}</T> : null}
        {people && !people.length ? <T c="muted">{q ? t('noPeople') : t('noAppPeople')}</T> : null}
        {(people || []).map(p => (
          <PersonRow key={p.id} person={p} status={statusOf(p.id)} busy={busy === p.id} onToggle={() => toggle(p)} />
        ))}
      </>}
    </Screen>
  );
}
