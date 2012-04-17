//
//  SaveImage.h
//
//  Created by MyFreeWeb on 29/04/2010.
//  Copyright 2010 MyFreeWeb.
//  MIT licensed
//

#import <Foundation/Foundation.h>

#import <UIKit/UIKit.h>

#ifdef CORDOVA_FRAMEWORK
    #import <Cordova/CDVPlugin.h>
    #import <Cordova/NSData+Base64.h>
#else
    #import "CDVPlugin.h"
    #import "NSData+Base64.h"
#endif

@interface SaveImage : CDVPlugin {
}

- (void)saveImage:(NSMutableArray*)sdata withDict:(NSMutableDictionary*)options;
@end
