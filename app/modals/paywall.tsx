import React from 'react';import{router}from'expo-router';import{PaywallModal}from'@/components/arena/PaywallModal'
export default function PaywallRoute(){return <PaywallModal visible onClose={()=>router.back()}/>}
