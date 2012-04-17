//
//  SaveImage.h
//
//  Created by MyFreeWeb on 29/04/2010.
//  Copyright 2010 MyFreeWeb.
//  MIT licensed
//

#import <UIKit/UIKit.h>
#ifdef CORDOVA_FRAMEWORK
    #import <Cordova/NSData+Base64.h>
#else
    #import "NSData+Base64.h"
#endif

#import "SaveImage.h"
@implementation SaveImage

- (void)saveImage:(NSMutableArray*)sdata withDict:(NSMutableDictionary*)options
{
  NSData *result = [NSData dataFromBase64String:[sdata objectAtIndex:0]];
  UIImage *image = [UIImage imageWithData:result];
  UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil);
  UIAlertView *alert= [[UIAlertView alloc] initWithTitle:nil message:@"Image Saved" delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil];
  [alert show];
}
@end
